'use strict';
import * as vscode from 'vscode';
import { grep, reduceLocations } from './grep';



/**
 * ReferenceProvider for assembly language.
 */
export class ReferenceProvider implements vscode.ReferenceProvider { 
    /**
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options 
     * @param token 
     */
    public provideReferences(document: vscode.TextDocument, position: vscode.Position, options: { includeDeclaration: boolean }, token: vscode.CancellationToken): Thenable<vscode.Location[]> {
            return this.search(document, position);
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     */
    protected search(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.Location[]>
    {
        return new Promise<vscode.Location[]>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            const searchRegex = new RegExp('^([^"]*)\\b' + searchWord + '\\b');

            grep(searchRegex)
            .then(locations => {
                reduceLocations(locations, document.fileName, position)
                .then(reducedLocations => {
                    return resolve(reducedLocations);
                });
            });
        });
    }

}
