import * as vscode from 'vscode';
import {stripAllComments} from './comments';
import {FileInfo, getCompleteLabel, getLabelAndModuleLabelFromFileInfo, getModuleFileInfo} from './grepextra';
import {AllowedLanguageIds, LanguageId}  from './languageId';
import {CommonRegexes} from './regexes/commonregexes';


export interface FileMatch {
    /// The file path of the match:
    filePath: string,
    /// The line number:
    line: number,
    /// The column:
    start: number,
    /// The end column:
    end: number,
    /// The contents of the found line:
    lineContents: string,
    /// The corresponding match object.
    match: RegExpExecArray
}


/**
 * This extends the vscode location object by
 * the match object.
 * Used in 'findLabelsWithNoReference'.
 */
export class GrepLocation extends vscode.Location {
    /// The match (e.g. line number, line contents etc.) that led to the location.
    public fileMatch: FileMatch;

    /// The complete label on the line. (May miss the module name.)
    public symbol: string;

    /// The label (symbol).
    public label: string;

    /// The full label (with module).
    public moduleLabel: string;

    /**
     * Creates a new location object.
     * @param uri The resource identifier.
     * @param rangeOrPosition The range or position. Positions will be converted to an empty range.
     * @param fileMatch The complete file match object.
     * @param symbol The label, i.e. part of the label (without module name).
     */
    constructor(uri: vscode.Uri, rangeOrPosition: vscode.Range | vscode.Position, fileMatch: FileMatch) {
        super(uri, rangeOrPosition);
        this.fileMatch = fileMatch;
        const {label} = getCompleteLabel(fileMatch.lineContents, fileMatch.start);
        this.symbol = label;
    }
}


/**
 * Remove all duplicates from the location list.
 * @param locations An array with locations, some entries might be doubled.
 * @param handler(loc) Returns a string that should be used to find equal entries.
 * @returns An array of locations with unique entries.
 */
export function removeDuplicates(locations: GrepLocation[], handler: (loc: GrepLocation) => string): GrepLocation[] {
    // Put all in a map;
    const locMap = new Map<string, GrepLocation>();
    locations.forEach(loc => locMap.set(handler(loc), loc));
    // Then generate an array from the map:
    const results = Array.from(locMap.values());
    return results;
}


/** Open a text document through the vscode api.
 * can be called with await.
 * @param filePath The file path.
 * @returns the text document.
 */
export async function openTextDocument(filePath: string) {
    return new Promise<vscode.TextDocument>((resolve, reject) => {
        const uri = vscode.Uri.file(filePath);
        vscode.workspace.openTextDocument(uri).then(
            textDoc => resolve(textDoc),
            reason => reject(reason)
        );
    });
}


/**
 * Returns an array of strings for the given file.
 * Reads it either from the open editor or from the file itself.
 * @param fileName The filename of the document.
 */
async function getLinesForFile(filePath: string): Promise<string[]> {
    try {
        // Doc is read through vscode API
        const textDoc: vscode.TextDocument = await openTextDocument(filePath);
        const lines = textDoc.getText().split('\n');

        // Strip comments
        stripAllComments(lines);
        return lines;
    }
    catch (e) {
        console.log(e);
        return [];
    }
}


/**
 * Searches files according to opts.
 * opts includes the directory the glob pattern and the regular expression (the word) to
 * search for.
 * @param regex The regular expression to search for.
 * @param rootFolder The search is limited to the root / project folder. This needs to contain a trailing '/'.
 * @param languageId Only files with the language ID are grepped. Is either "asm-collection" or "asm-list-file".
 * @param globExcludeFiles The glob pattern to use to exclude files.
 * @returns An array of the vscode locations of the found expressions.
 */
export async function grep(regex: RegExp, rootFolder: string, languageId: AllowedLanguageIds, globExcludeFiles: string): Promise<GrepLocation[]> {
    const allMatches = new Map();

    try {
        const globInclude = LanguageId.getGlobalIncludeForLanguageId(languageId);
        const allUris = await vscode.workspace.findFiles(globInclude, globExcludeFiles);
        const uris = allUris.filter(uri => uri.fsPath.startsWith(rootFolder));
        for (const uri of uris) {
            // Check if file is opened in editor
            const filePath = uri.fsPath;
            const foundDoc = await openTextDocument(filePath);

            // Check file in vscode
            const fileMatches = grepTextDocument(foundDoc, regex);
            // Add filename to matches
            for (const match of fileMatches) {
                match.filePath = filePath;
            }
            // Store
            allMatches.set(filePath, fileMatches);
        }
    }
    catch (e) {
        console.log("Error: ", e);
    }

    // Convert matches to vscode locations
    const locations: Array<GrepLocation> = [];
    for (const [file, matches] of allMatches) {
        // Iterate all matches inside file
        for (const match of matches) {
            const lineNr = match.line;
            let colStart = match.start;
            // Check for dot label
            //if (match.match[1].indexOf('.')>=0)
            //    colStart--; // include the dot
            const colEnd = match.end;
            const startPos = new vscode.Position(lineNr, colStart);
            const endPos = new vscode.Position(lineNr, colEnd);
            const loc = new GrepLocation(vscode.Uri.file(file), new vscode.Range(startPos, endPos), match);
            // store
            locations.push(loc);
        }
    }

    return locations;
}


/**
 * Greps for multiple regular expressions. E.g. used to search for labels
 * terminated by a ':' and for labels that start on 1rst column.
 * Simply calls 'grep' multiple times.
 * @param regexes Array of regexes.
 * @param rootFolder The search is limited to the root / project folder. This needs to contain a trailing '/'.
 * @param languageId Only files with the language ID are grepped. Is either "asm-collection" or "asm-list-file".
 * @param globExcludeFiles The glob pattern to use to exclude files.
 * @return An array with all regex search results.
 */
export async function grepMultiple(regexes: RegExp[], rootFolder: string, languageId: AllowedLanguageIds, globExcludeFiles: string): Promise<GrepLocation[]> {
    let allLocations: Array<GrepLocation> = [];

    // grep all regex
    for (const regex of regexes) {
        const locations = await grep(regex, rootFolder, languageId, globExcludeFiles);
        // Add found locations
        allLocations.push(...locations);
    }

    // Remove double entries
    if (regexes.length > 0) {
        allLocations = removeDuplicates(allLocations, loc => {
            const fm = loc.fileMatch;
            const s = fm.filePath + ':' + fm.line + ':' + fm.start;
            return s;
        });
    }

    // Return all
    return allLocations;
}


/**
 * Searches a vscode.TextDocument for a regular expression and
 * returns the found line numbers.
 * @param doc The TextDocument.
 * @returns An array that contains: line number, start column, end column, and the text of the line.
 */
export function grepTextDocument(doc: vscode.TextDocument, regex: RegExp): FileMatch[] {
    const matches: FileMatch[] = [];

    // Strip all comments
    const lines = doc.getText().split('\n');
    stripAllComments(lines);

    // Go through all lines
    const len = lines.length;
    for (let line = 0; line < len; line++) {
        const lineContents = lines[line];

        regex.lastIndex = 0;    // If global search is used, make sure it always start at 0
        do {
            const match = regex.exec(lineContents);
            if (!match)
                break;

            // Found: get start and end
            const start = CommonRegexes.calcStartIndex(match);
            const end = match.index + match[0].length;


            // Store found result
            matches.push({
                filePath: undefined as any,
                line,  // line number (starts at 0)
                start,  // start column
                end,    // end column
                lineContents,
                match
            });
        } while (regex.global);  // Note if "g" was specified multiple matches (e.g. for rename) can be found.
    }
    return matches;
}


/**
 * Greps for multiple regexes in the text document.
 * Simply calls grepTextDocument several times.
 * @param doc The document to search.
 * @param regexes An array of regular expressions.
 * @return An array with all matches.
 */
export function grepTextDocumentMultiple(doc: vscode.TextDocument, regexes: RegExp[]): FileMatch[] {
    const allMatches: FileMatch[] = [];

    // grep all regex
    for (const regex of regexes) {
        // grep doc
        const fileMatches = grepTextDocument(doc, regex);
        // Add found matches
        allMatches.push(...fileMatches);
    }

    // Return all
    return allMatches;
}


/**
 * Returns the last portion of a label.
 * @param label  E.g. 'explosion.init' or 'check_all'
 * @return E.g. 'init' or 'check_all'.
 */
/*
export function getLastLabelPart(label: string): string {
    const k = label.indexOf('.');
    if (k < 0)
        return label;   // No dot.

    return label.substring(k + 1);
}
*/


/**
 * Converts the given label into a regular expression.
 * Changes the last part of the label into a regex that
 * allows various other letters in between.
 * E.g. 'sound.initial' will become 'sound.\\w*i\\w*n\\w*i\\w*t\\w*a\\w*l\\w*
 * so that the regular expression would also match if not all
 * characters are in the right order.
 * E.g. this would match: 'sound.initialize'.
 * @param label  E.g. 'explosion.init' or 'check_all'
 * @return E.g. 'explosion.\\w*i\\w*n\\w*i\\w*t\\w*'or
 * '\\w*c\\w*h\\w*e\\w*c\\w*k\\w*_\\w*a\\w*l\\w*l\\w*'
 */
export function getRegExFromLabel(label: string): RegExp {
    // Get last portion
    let prefix;
    let lastPart;
    const k = label.indexOf('.');
    if (k < 0) {
        // No dot
        prefix = '';
        lastPart = label;
    }
    else {
        // Includes dot
        prefix = label.substring(0, k + 1);
        lastPart = label.substring(k + 1);
    }

    // Change last part
    const lastRegexStr = CommonRegexes.regexPrepareFuzzy(lastPart) + '\\w*';
    let regexStr = prefix.replace(/(\.)/g, '\\.');  // Make sure to convert . to \. for regular expression.
    regexStr += lastRegexStr;

    // Return
    const regex = new RegExp(regexStr, 'i');
    return regex;
}


/**
 * Reduces the number of found 'locations'. Is used to get rid of wrong references
 * by checking the dot notation/module label.
 * 1. Get the module-label (=searchLabel).
 * 2. Get the module-labels for each found location and the corresponding file.
 * 3. 'searchLabel' is compared with all labels.
 * 4. If 'searchLabel' is not equal to the direct label and not equal to the
 *    concatenated label it is removed from 'locations'
 * @param regexLbls Regexes to find labels. A different regex depending on asm or list file and colons used or not.
 * @param locations An array with found locations of grepped labels.
 * @param docFileName The document of the original label.
 * @param position The position inside the document with the original label.
 * @param removeOwnLocation true (default) to remove the location of the searched word.
 * @param checkFullName true (default) = During label check the full name is checked. false (e.g.
 * for CompletionProvider) = It is checked with 'startsWith'.
 */
export async function reduceLocations(regexLbls: RegExp, locations: GrepLocation[], docFileName: string, position: vscode.Position, removeOwnLocation = true, checkFullName = true, regexEnd = /[\w\.]/): Promise<GrepLocation[]> {
    //console.log('reduceLocations');
    // 1. Get module label
    const docLines = await getLinesForFile(docFileName);
    const docModStructInfos = getModuleFileInfo(docLines);
    const docFileInfo = {
        lines: docLines,
        modStructInfos: docModStructInfos
    };
    const searchLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, docFileInfo, position.line, position.character, regexEnd);

    // For item completion:
    let regexLabel;
    let regexModuleLabel;

    // Check for full name
    if (!checkFullName) {
        regexLabel = getRegExFromLabel(searchLabel.label);
        regexModuleLabel = getRegExFromLabel(searchLabel.moduleLabel);
    }

    // Copy locations
    const redLocs = [...locations];

    // Create map to cache files/module/label information
    const filesInfo = new Map<string, FileInfo>();

    // 2. Get the module-labels for each found location and the corresponding file.
    let i = redLocs.length;
    //let removedSameLine = -1;
    while (i--) {    // loop backwards
        // Get fileName
        const loc = redLocs[i];
        const fileName = loc.uri.fsPath;
        const pos = loc.range.start;

        // Check if file was already analyze for modules and labels
        let fileInfo = filesInfo[fileName];
        if (!fileInfo) {
            const lines = await getLinesForFile(fileName);
            const modStructInfos = getModuleFileInfo(lines);
            fileInfo = {
                lines,
                modStructInfos
            };
            filesInfo[fileName] = fileInfo;
        }

        // Check if same location as searchLabel.
        if (removeOwnLocation
            && pos.line == position.line
            && fileName == fileName) {
            // Remove also this location
            redLocs.splice(i, 1);
            // Remember
            //removedSameLine = i;
            continue;
        }

        const mLabel = getLabelAndModuleLabelFromFileInfo(regexLbls, fileInfo, pos.line, pos.character, regexEnd);
        // Assign to location
        loc.label = mLabel.label;
        loc.moduleLabel = mLabel.moduleLabel;
        // 3. 'searchLabel' is compared with all labels.
        if (checkFullName) {
            if (mLabel.label == searchLabel.label
                || mLabel.moduleLabel == searchLabel.moduleLabel
                || mLabel.moduleLabel == searchLabel.label
                || mLabel.label == searchLabel.moduleLabel)
                continue; // Please note: the test is ambiguous. There might be situations were this is wrong.
        }
        else {
            // Compare regular expressions to catch also scrambled input.
            if (regexLabel.exec(mLabel.label)
                || regexModuleLabel.exec(mLabel.moduleLabel)
                || regexLabel.exec(mLabel.moduleLabel)
                || regexModuleLabel.exec(mLabel.label))
                continue;
        }
        // 4. If 'searchLabel' is not equal to the direct label and not equal to the
        //    concatenated label it is removed from 'locations'
        redLocs.splice(i, 1);  // delete
    }

    // Return.
    // If reduced locations has removed too much (all) then fall back to the original array.
    // This can e.g. happen for STRUCT fields.
    /*
    if(redLocs.length == 0) {
        // Copy again.
        redLocs = [...locations];
        // But remove the searchLabel
        if(removedSameLine >= 0)
            redLocs.splice(removedSameLine,1)
    }
    */

    // Remove all duplicates from the list:
    const uniqueLocations = redLocs; // removeDuplicates(redLocs, loc => loc.moduleLabel);

    return uniqueLocations;
}


/**
 * Searches 'lines' from beginning to 'len' and returns the (concatenated)
 * module label.
 * 'lines' are searched for 'MODULE' and 'ENDMODULE' to retrieve the module information.
 * Additional searches for STRUCTs and treats them in the same way.
 * @param lines An array of strings containing the complete text.
 * @param len The line number up to which it will be searched. (excluding)
 * @returns A string like 'audio.samples'.
 */
export function getModule(lines: Array<string>, len: number): string {
    const regexModule = CommonRegexes.regexModuleStruct();
    const regexEndmodule = CommonRegexes.regexEndModuleStruct();
    const modules: Array<string> = [];
    for (let row = 0; row < len; row++) {
        const lineContents = lines[row];

        // MODULE
        const matchModule = regexModule.exec(lineContents);
        if (matchModule) {
            modules.push(matchModule[2]);
            continue;
        }

        // ENDMODULE
        const matchEndmodule = regexEndmodule.exec(lineContents);
        if (matchEndmodule) {
            modules.pop();
            //continue; // Is last statement anyway
        }
    }

    // Create module label
    const mLabel = modules.join('.');

    return mLabel;
}


/**
 * Prints out all found locations.
 * @param locs The locations.
 *
 */
export function dbgPrintLocations(locs: GrepLocation[]) {
    for (let loc of locs) {
        console.log(loc.symbol + ': ' + loc.label + ', ' + loc.moduleLabel);
    }
}
