'use strict';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations } from './grep';



/**
 * DefinitionProvider for assembly language.
 * Called from vscode e.g. for "Goto definition".
 */
export class DefinitionProvider implements vscode.DefinitionProvider { 
    /**
     * Called from vscode if the used selects "Goto definition".
     * @param document The current document.
     * @param position The position of the word for which the definition should be found.
     * @param options 
     * @param token 
     */
    public provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Location[]> {
           return this.search(document, position);
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @return A promise to an array with locations. Normally there is only one entry to the array.
     */
    public search(document, position): Thenable<vscode.Location[]>
    {
        return new Promise<vscode.Location[]>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            // Find all "something:" (labels) in the document
            const searchNormal = new RegExp('^(\\s*)[\\w\\.]*\\b' + searchWord + ':');
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = new RegExp('^()[\\w\\.]*\\b' + searchWord + '\\b(?![:\._])');
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = new RegExp('^(\\s+MODULE\\s)' + searchWord + '\\b');
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = new RegExp('^(\\s+MACRO\\s)' + searchWord + '\\b');

            // Find all sjasmplus STRUCTs in the document
            const searchsJasmStruct = new RegExp('^(\\s+STRUCT\\s)' + searchWord + '\\b');

            grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro, searchsJasmStruct])
            .then(locations => {
                reduceLocations(locations, document, position)
                .then(reducedLocations => {
                    // There should be only one location.
                    // Anyhow return the whole array.
                    return resolve(reducedLocations);
                });
            });
        });

    }

}
