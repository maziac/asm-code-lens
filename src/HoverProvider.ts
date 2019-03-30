'use strict';
import * as vscode from 'vscode';
import { grepMultiple, read, reduceLocations, getLabelAndModuleLabel } from './grep';
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
        let settings = vscode.workspace.getConfiguration('asm-code-lens');
        if(settings.enableHoverProvider)
            return this.search(document, position);
        else
            return undefined; // new vscode.Hover;
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @return A promise with a vscode.Hover object.
     */
    private search(document, position): Thenable<vscode.Hover>
    {
        return new Promise<vscode.Hover>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            // Find all "something:" (labels) in the document
            const searchNormal = new RegExp('^(\\s*)[\\w\\.]*\\b' + searchWord + ':');
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = new RegExp('^()[\\w\\.]*\\b' + searchWord + '\\b(?![:\._])');
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = new RegExp('^(\\s+MODULE\\s)' + searchWord + '\\b');

            grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule])
//            grepMultiple([searchsJasmModule])
            .then(locations => {
                // Reduce the found locations.
                // Please note that the label location itself is also removed.
                // I.e. you cannot hover a label definition.
                // Anyhow doesn't make sense because the text is visible
                // in the sources.
                reduceLocations(locations, document, position, false)
                .then(reducedLocations => {
                    // Now read the comment lines above the document.
                    // Normally there is only one but e.g. if there are 2 modules with teh same name there could be more.
                    const hoverTexts = new Array<string>();
                    const f = (index: number) => {
                        // Check for end
                        if(index < reducedLocations.length) {
                            // Not end.
                            const loc = reducedLocations[index];
                            const lineNr = loc.range.start.line;
                            const filePath = loc.uri.fsPath;
                            const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

                            read(readStream, data => {
                                const lines = data.split('\n');
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
                            });
                        }
                        else {
                            // End of processing.
                            // Check if 0 entries
                            if(hoverTexts.length == 0)
                                hoverTexts.push('...');
                            else
                                hoverTexts.splice(0,1); // Remove first ('------')
                            // return
                            const hover = new vscode.Hover(hoverTexts);
                            return resolve(hover);
                        }
                    };

                    // Loop all found entries.
                    f(0);
                    
                });
            });

        });
    }

}
