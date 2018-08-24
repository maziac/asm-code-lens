'use strict';
import * as vscode from 'vscode';
import { grep } from './grep';



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
            const searchRegex = new RegExp('\\b' + searchWord + '\\b');

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
                const match = entry[1];
                const result = match[0];
                const text = result.lineContents;
                const hover = new vscode.Hover(text);
                return resolve(hover);
              });
        });
    }

}
