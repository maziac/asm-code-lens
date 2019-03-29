import * as vscode from 'vscode';
import * as fs from 'fs';
//import * as path from 'path';
import * as PQueue from 'p-queue';
//import * as fastGlob from 'fast-glob';
import { CodeLensProvider } from './CodeLensProvider';
import { runInDebugContext } from 'vm';


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
        this.symbol = getCompleteLabel(fileMatch.lineContents, fileMatch.start);
    }
}

/**
 * Reads data from a stream.
 * @param stream 
 * @param onData 
 */
export function read(stream, onData) {
    return new Promise((resolve, reject) => {
        const promises = [];
        stream.on('data', data => promises.push(onData(data)));
        stream.on('error', reject);
        stream.on('end', () => Promise.all(promises).then(resolve));
    });
}


/**
 * Checks the list of 'docs' for a given 'filePath' and returns the corresponding 
 * text document.
 * @param filePath 
 * @param docs The list of text documents. Obtained with vscode.workspace.textDocuments.filter(doc => doc.isDirty)
 * @returns The vscode.TextDcoument or undefined if not found.
 */
export function getTextDocument(filePath: string, docs: Array<vscode.TextDocument>): vscode.TextDocument {
    // Check if file is opened in editor
    let foundDoc;
    for(const doc of docs) {
        //if(doc.isDirty)    // Only check dirty documents, other are on disk
            if(doc.fileName == filePath) {
                foundDoc = doc;
                break;
            }
    }
    return foundDoc;
}


/**
 * Searches files according to opts.
 * opts includes the directory the glob pattern and the regular expression (the word) to
 * search for.
 * @param opts opts.regex = the regular expression to search for, 
 * opts.singleResult = true/false, if true only a single result is 
 * returned (faster).
 * @returns An array of the vscode locations of the found expressions.
 */
export async function grep(opts): Promise<GrepLocation[]> {
    //const cwd = opts.cwd;
    //const globs = opts.globs || ['**/*.{asm,inc,s,a80}'];
    const regex = opts.regex;
    const singleResult = opts.singleResult;
    
    const readQueue = new PQueue();
    //const fileStream = fastGlob.stream(globs, {cwd: cwd} );
    const allMatches = new Map();
    let leave = false;
    
    await vscode.workspace.findFiles('**/*.{asm,inc,s,a80}', null)
    .then(async uris => {
        const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
 
        for(const uri of uris) {
        
            if(leave)
                return;

            // get fileName
            const fileName = uri.fsPath;
        
            await readQueue.add(async () => {
                if(leave)
                    return;
            
                const filePath = fileName;

                // Check if file is opened in editor
                let foundDoc = getTextDocument(filePath, docs);

                // Check if file on disk is checked or in vscode
                if(foundDoc) {
                    // Check file in vscode
                    const fileMatches = grepTextDocument(foundDoc, regex);
                    // Add filename to matches
                    for(const match of fileMatches) {
                        match.filePath = fileName;
                    }
                    // Store
                    allMatches.set(fileName, fileMatches);
                }
                else {
                    // Check file on disk
                    const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                    let fileMatches = allMatches.get(fileName);
                    let lastIndex = 0;
            
                    await read(readStream, data => {
                        if(leave)
                            return;

                        const lines = data.split('\n');
                        const len = lines.length;
                        for (let index = 0; index < len; index++) {
                            const lineContents = lines[index];
                            const line = lastIndex + index;
                            const match = regex.exec(lineContents);
                            if(!match) 
                                continue;
                    
                            let start = match.index;
                            if(match[1]) {
                                // This capture group surrounds the start til the searched word begins. It is used to adjust the found start index.
                                const i = match[1].length;
                                start += i;
                            }
                            let end = match[0].length;

                            if (!fileMatches) {
                                fileMatches = [];
                                allMatches.set(fileName, fileMatches);
                            }
                
                            fileMatches.push({
                                filePath,
                                line,
                                start,
                                end,
                                lineContents,
                                match
                            });

                            // Check if only one result is wanted
                            if(singleResult) {
                                leave = true;
                                return;
                            }
                        }
            
                        lastIndex += len;
                    });
                }
                if(leave)
                    return;
            });
        }
    });

    // Convert matches to vscode locations
    const locations: Array<GrepLocation> = [];
    for(const [file,matches] of allMatches) {
        // Iterate all matches inside file
        for(const match of matches) {
            const lineNr = match.line;
            const colStart = match.start;
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
 * Searches a vscode.TextDocument for a regular expression and
 * returns the found line numbers.
 * @param doc The TextDocument.
 * @returns An array that contains: line number, start column, end column, and the text of the line.
 */
export function grepTextDocument(doc: vscode.TextDocument, regex: RegExp): Array<FileMatch> {
    const matches = new Array<FileMatch>();
    const len = doc.lineCount;
    for (let line=0; line<len; line++) {
        const textLine = doc.lineAt(line);
        const lineContents = textLine.text;

        let match = regex.exec(lineContents);
        while(match !== null) {
             // Found: get start and end
            const start = match.index;
            const end = match.index + match[0].length;

            // Store found result
            matches.push({
                filePath: undefined,
                line,  // line number (starts at 0)
                start,  // start column
                end,    // end column
                lineContents,
                match
            });

            // Note if "g" was specified multiple matches (e.g. for rename) can be found.
            if(regex.global)
                match = regex.exec(lineContents)
            else 
                match = null;
        }
    }
    return matches;
}


/**
 * Concatenates a module and a label.
 * @param module E.g. 'sound.effects'.
 * @param label  E.g. 'explosion'
 * @return E.g. sound.effects.explosion. If module is undefined or an emtpy string then label is returned unchanged.
 */
function concatenateModuleAndLabel(module: string, label: string): string {
    if(!module)
        return label;
    if(module.length == 0)
        return label;
        
    const mLabel = module + '.' + label;
    return mLabel;
}


/**
 * Returns the label and the module label (i.e. module name + label) for a given
 * file and position.
 * The file may be on disk or opened in the editor.
 * 1. The original label is constructed from the document and position info.
 * 2. The document is parsed from begin to position for 'MODULE' info.
 * 3. The MODULE info is added to the orignal label (this is now the searchLabel).
 * 4. Both are returned.
 * @param fileName The filename of the document.
 * @param pos The position that points to the label.
 * @param documents All dirty vscode.TextDocuments.
 * @returns { label, module.label }
 */
export async function getLabelAndModuleLabel(fileName: string, pos: vscode.Position, documents: Array<vscode.TextDocument>): Promise<{label: string, moduleLabel: string}> {
    //const readQueue = new PQueue();

    // Get fileName

    let label: string;
    let moduleLabel: string;

    // Get line/column
    const row = pos.line;
    const clmn = pos.character;

    // Check if file is opened in editor
    const filePath = fileName;
    let foundDoc = getTextDocument(filePath, documents);

    let lines: Array<string>;
    // Different handling: open text document or file on disk
    if(foundDoc) {
        // Doc is opened in text editor (and dirty).
        lines = foundDoc.getText().split('\n');
    }
    else {
        // Doc is read from disk.
        const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

        await read(readStream, data => {
            lines = data.split('\n');
        });
    }
    
    // 1. Get original label
    const line = lines[row];
    label = getCompleteLabel(line, clmn);

    // 2. The document is parsed from begin to 'pos' for 'MODULE' info.
    const module = getModule(lines, row);

    // 3. The MODULE info is added to the orignal label
    moduleLabel = concatenateModuleAndLabel(module, label);

    // return
    return {label, moduleLabel};
}


/**
 * Reduces the number of found 'locations'. Is used to get rid of wrong references
 * by checking the dot notation/module label.
 * 1. Get the module-label (=searchLabel).
 * 2. Get the module-labels for each found location and the corresponding file.
 * 3. 'searchLabel' is compared with all labels.
 * 4. If 'searchLabel' is not equal to the direct label and not equal to the 
 *    concatenated label it is removed from 'locations'
 * @param locations An array with found locations of grepped labels.
 * @param document The document of the original label.
 * @param position The position inside the document with the original label.
 */
export async function reduceLocations(locations: GrepLocation[], document: vscode.TextDocument, position: vscode.Position): Promise<GrepLocation[]> {
    const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);

    // 1. Get module label
    let searchLabel;
    await getLabelAndModuleLabel(document.fileName, position, docs)
    .then(mLabel => {
        searchLabel = mLabel;
    });

    // Copy locations
    const redLocs = [...locations]

    // 2. Get the module-labels for each found location and the corresponding file.
    let i = redLocs.length;
    while(i--) {    // loop backwards
        // get fileName
        const loc = redLocs[i];
        const fileName = loc.uri.fsPath;
        const pos = loc.range.start;

        // Check if same location as searchLabel.
        if(pos.line == position.line
            && fileName == document.fileName) {
            // Remove also this location
            redLocs.splice(i,1); 
            continue;
        }

        await getLabelAndModuleLabel(fileName, pos, docs)
        .then(mLabel => {
            // 3. 'searchLabel' is compared with all labels.
            if(searchLabel.label == mLabel.label
                || searchLabel.moduleLabel == mLabel.moduleLabel
                || searchLabel.label == mLabel.moduleLabel
                || searchLabel.moduleLabel == mLabel.label)
                return; // Please note: the test is ambiguous. There might be situations were this is wrong.
            // 4. If 'searchLabel' is not equal to the direct label and not equal to the 
            //    concatenated label it is removed from 'locations'
            redLocs.splice(i,1);  // delete
        });
    }

    // Return
    return redLocs;
}


/**
 * Searches 'lines' from beginning to 'len' and returns the (concatenated)
 * module label.
 * 'lines' are searched for 'MODULE' and 'ENDMODULE' to retrieve the module information.
 * @param lines An array of strings containing the complete text.
 * @param len The line number up to which it will be searched. (excluding)
 * @returns A string like 'audio.samples'.
 */
export function getModule(lines: Array<string>, len: number): string {
    const regexModule = new RegExp(/^\s+(MODULE)\s+([\w\._]+)/i);
    const regexEndmodule = new RegExp(/^\s+(ENDMODULE)[\s$]/i);
    const modules: Array<string> = [];
    for (let row=0; row<len; row++) {
        const lineContents = lines[row];
        
        // MODULE
        const matchModule = regexModule.exec(lineContents);
        if(matchModule) {
            modules.push(matchModule[2]);
            continue;
        }

        // ENDMODULE
        const matchEndmodule = regexEndmodule.exec(lineContents);
        if(matchEndmodule) {
            modules.pop();
            continue;
        }
    }

    // Create module label
    const mLabel = modules.join('.');

    return mLabel;
}


/**
 * Returns the complete label around the 'startIndex'.
 * I.e. startIndex might point to the last part of the label then this
 * function returns the complete label.
 * @param lineContents The text of the line.
 * @param startIndex The index into the label.
 */
function getCompleteLabel(lineContents: string, startIndex: number): string {
    // Find end of label.
    const len = lineContents.length;
    let k;
    for(k = startIndex; k<len; k++) {
        const s = lineContents.charAt(k);
        if(s == ' ' || s == '\t' || s == ':' || s == ';' || s == ')')
            break;
    }
    // k points now after the label
    
    // Find start of label.
    let i;
    for(i = startIndex; i>=0; i--) {
        const s = lineContents.charAt(i);
        if(s == ' ' || s == '\t' || s == ';' || s == '(')
            break;
    }
    // i points one before the start of the label
    i++;

    // Get complete string
    const completeLabel = lineContents.substr(i, k-i);

    return completeLabel;
}


function getLabelAtPosition(doc: vscode.TextDocument) {

}
