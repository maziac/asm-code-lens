import * as vscode from 'vscode';
import * as path from 'path';
import { grepMultiple, reduceLocations, getCompleteLabel } from './grep';
import {regexLabelColonForWord, regexLabelWithoutColonForWord, regexModuleForWord, regexMacroForWord} from './regexes';
import * as fs from 'fs';


/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {
    protected rootFolder: string;   // The root folder of the project.


    /**
     * Constructor.
     * @param rootFolder Stores the root folder for multiroot projects.
     */
    constructor(rootFolder: string) {
        // Store
        this.rootFolder = rootFolder + path.sep;
    }


    /**
     * Called from vscode if the user hovers over a word.
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options
     * @param token
     */
    public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (docPath.indexOf(this.rootFolder) < 0)
            return undefined as any; // Path is wrong.
        // Right path.
        return await this.search(document, position);
    }


    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @return A promise with a vscode.Hover object.
     */
    protected async search(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover> {
        return new Promise<vscode.Hover>(async (resolve, reject) => {
            // Check for local label
            const lineContents = document.lineAt(position.line).text;
            const {label} = getCompleteLabel(lineContents, position.character);
            //console.log("provideHover", this.rootFolder, document.uri.fsPath, "'" + label + "'");
            if (label.startsWith('.')) {
                const hover = new vscode.Hover('');
                resolve(hover);
            }

            // It is a non local label
            const range = document.getWordRangeAtPosition(position);
            const searchWord = document.getText(range);
            // Find all "something:" (labels) in the document
            const searchNormal = regexLabelColonForWord(searchWord);
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = regexLabelWithoutColonForWord(searchWord);
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = regexModuleForWord(searchWord);
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = regexMacroForWord(searchWord);

            // Put all searches in one array
            const searchRegexes = [searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro];

            const locations = await grepMultiple(searchRegexes, this.rootFolder);
            // Reduce the found locations.
            const reducedLocations = await reduceLocations(locations, document.fileName, position, false);
            // Now read the comment lines above the document.
            // Normally there is only one but e.g. if there are 2 modules with the same name there could be more.
            const hoverTexts = new Array<vscode.MarkdownString>();
            const f = (index: number) => {
                // Check for end
                if (index < reducedLocations.length) {
                    // Not end.
                    const loc = reducedLocations[index];
                    const lineNr = loc.range.start.line;
                    const filePath = loc.uri.fsPath;
                    const linesData = fs.readFileSync(filePath, {encoding: 'utf-8'});
                    const lines = linesData.split('\n');

                    // Now find all comments above the found line
                    const prevHoverTextArrayLength = hoverTexts.length;
                    const text = lines[lineNr];
                    const textMd = new vscode.MarkdownString();
                    textMd.appendText(text);
                    if (text.indexOf(';') >= 0 || text.toLowerCase().indexOf('equ') >= 0)  // TODO: indexOf of undefined
                        hoverTexts.unshift(textMd);
                    let startLine = lineNr - 1;
                    while (startLine >= 0) {
                        // Check if line starts with ";"
                        const line = lines[startLine];
                        const match = /^\s*;(.*)/.exec(line);
                        if (!match)
                            break;
                        // Add text
                        const textMatch = new vscode.MarkdownString();
                        textMatch.appendText(match[1]);
                        hoverTexts.unshift(textMatch);
                        // Next
                        startLine--;
                    }

                    // Separate several entries
                    if (prevHoverTextArrayLength != hoverTexts.length)
                        hoverTexts.unshift(new vscode.MarkdownString('============'));

                    // Call next
                    f(index + 1);
                }
                else {
                    // End of processing.
                    // Check if 0 entries
                    if (hoverTexts.length == 0)
                        return resolve(undefined as any);  // Nothing found

                    // Remove first ('============');
                    hoverTexts.splice(0, 1);

                    // return
                    const hover = new vscode.Hover(hoverTexts);
                    resolve(hover);
                }
            };

            // Loop all found entries.
            f(0);
        });
    }

}
