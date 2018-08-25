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
           return this.search(document, position);
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     */
    private search(document, position): Thenable<vscode.Hover>
    {
        return new Promise<vscode.Hover>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            const searchRegex = new RegExp('\\b' + searchWord + ':');

            const dir = vscode.workspace.rootPath;
            grep({
                //cwd: __dirname,
                cwd: dir,
                globs: ['**/*.{asm,inc,s,a80}'],
                regex: searchRegex,
                singleResult: true
              }).then(function(filematches) {
                //console.log(filematches);
                // Get match 
                const iter = filematches.entries();
                const entry = iter.next().value;
                const filename = entry[0];
                const matches = entry[1];
                const result = matches[0];
                const lineNr = result.line;
                const text = result.lineContents;

                // Now read the comment lines above the found word.
                const filePath = path.join(dir, filename);
                const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                read(readStream, data => {
                    const lines = data.split('\n');
                    // Now find all comments abofe the found line
                    const hoverTexts = new Array<string>();
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
