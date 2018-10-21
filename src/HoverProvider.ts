'use strict';
import * as vscode from 'vscode';
import { grep, read } from './grep';
import * as fs from 'fs';
import * as path from 'path';



/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {

    /**
     * Called from vscode if the used selects "Find all references".
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
            const searchRegex = new RegExp('\\b' + searchWord + ':');

            grep({ regex: searchRegex, singleResult: true })
            .then(locations => {
                // There should be only one location.
                // Now read the comment lines above the found word.
                const loc = locations[0];
                const lineNr = loc.range.start.line;
                const filePath = loc.uri.fsPath;
                const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                read(readStream, data => {
                    const lines = data.split('\n');
                    // Now find all comments above the found line
                    const hoverTexts = new Array<string>();
                    const text = lines[lineNr];
                    hoverTexts.unshift(text);
                    let startLine = lineNr-1;
                    while(startLine >= 0) {
                        // Check if line starts with ";"
                        const line = lines[startLine];
                        const match = /^\s*;/.exec(line);
                        if(!match)
                            break;
                        // Add text
                        hoverTexts.unshift(line);    
                        // Next
                        startLine --;
                    }
                    // return
                    const hover = new vscode.Hover(hoverTexts);
                    return resolve(hover);
                });
            });
        });
    }

}
