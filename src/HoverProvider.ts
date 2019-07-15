'use strict';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations, getCompleteLabel } from './grep';
import { regexLabelColonForWord, regexLabelWithoutColonForWord, regexModuleForWord, regexMacroForWord, regexStructForWord } from './regexes';
import * as fs from 'fs';
import * as path from 'path';


/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {

    /**
     * Called from vscode if the user hovers over a word.
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options 
     * @param token 
     */
    public provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
        const settings = vscode.workspace.getConfiguration('asm-code-lens');
        if(settings.enableHovering == false) 
            return undefined;

        return this.search(document, position);
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @return A promise with a vscode.Hover object.
     */
    protected search(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Hover>
    {
        return new Promise<vscode.Hover>((resolve, reject) => {
            // Check for local label
            const lineContents = document.lineAt(position.line).text;
            const {label} = getCompleteLabel(lineContents, position.character);
            if(label.startsWith('.')) {
                const hover = new vscode.Hover('');
                resolve(hover);
            }

            // It is a non local label
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            // Find all "something:" (labels) in the document
            const searchNormal = regexLabelColonForWord(searchWord);
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = regexLabelWithoutColonForWord(searchWord);
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = regexModuleForWord(searchWord);
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = regexMacroForWord(searchWord);

            grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro])
//            grepMultiple([searchsJasmModule])
            .then(locations => {
                // Reduce the found locations.
                reduceLocations(locations, document.fileName, position, false)
                .then(reducedLocations => {
                    // Now read the comment lines above the document.
                    // Normally there is only one but e.g. if there are 2 modules with the same name there could be more.
                    const hoverTexts = new Array<string>();
                    const f = (index: number) => {
                        // Check for end
                        if(index < reducedLocations.length) {
                            // Not end.
                            const loc = reducedLocations[index];
                            const lineNr = loc.range.start.line;
                            const filePath = loc.uri.fsPath;
                            const linesData = fs.readFileSync(filePath, {encoding: 'utf-8'});
                            const lines = linesData.split('\n');
 
                            // Now find all comments above the found line
                            const text = lines[lineNr];
                            if(text.indexOf(';') >= 0)
                                hoverTexts.unshift(text);
                            let startLine = lineNr-1;
                            const prevHoverTextArrayLength = hoverTexts.length;
                            while(startLine >= 0) {
                                // Check if line starts with ";"
                                const line = lines[startLine];
                                const match = /^\s*;(.*)/.exec(line);
                                if(!match)
                                    break;
                                // Add text
                                hoverTexts.unshift(match[1]);     
                                // Next
                                startLine --;
                            }
                            // Separate several entries
                            if(prevHoverTextArrayLength != hoverTexts.length)
                                hoverTexts.unshift('============'); 
                            
                            // Call next
                            f(index+1);
                        }
                        else {
                            // End of processing.
                            // Check if 0 entries
                            if(hoverTexts.length == 0)
                                return resolve(undefined);  // Nothing found
                            
                            // Remove first ('============');
                            hoverTexts.splice(0,1);

                            // return
                            const hover = new vscode.Hover(hoverTexts);
                            resolve(hover);
                        }
                    };

                    // Loop all found entries.
                    f(0);
                    
                });
            });

        });
    }

}
