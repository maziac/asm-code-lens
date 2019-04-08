'use strict';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations } from './grep';
import { resolve } from 'path';
import { regexInclude, regexLabelColonForWord, regexLabelWithoutColonForWord, regexModuleForWord, regexMacroForWord, regexStructForWord } from './regexes';



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
        // Check for 'include "..."'
        const lineContents = document.lineAt(position.line).text;
        const match = regexInclude().exec(lineContents);
        if(match) {
            // INCLUDE found
            return this.getInclude(match[1]);
        }
        else {
            // Normal definition
            return this.search(document, position);
        }
    }

    
    /**
     * Searches the files that math the 'relPath' path.
     * @param relPath E.g. 'util/zxspectrum.inc'
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     * Points to the first line of the file.
     */
    protected getInclude(relPath: string): Thenable<vscode.Location[]> {
        return new Promise<vscode.Location[]>((resolve, reject) => {
            vscode.workspace.findFiles('**/'+relPath, null)
            .then(uris => {
                const locations: vscode.Location[] = [];
                const pos = new vscode.Position(0, 0);
                const range = new vscode.Range(pos, pos);
                for(const uri of uris) {
                    const loc = new vscode.Location(uri, range);
                    locations.push(loc);
                }    
                resolve(locations);             
            });
        });
    }


    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     */
    protected search(document, position): Thenable<vscode.Location[]>
    {
        return new Promise<vscode.Location[]>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            // Find all "something:" (labels) in the document
            const searchNormal = regexLabelColonForWord(searchWord);
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = regexLabelWithoutColonForWord(searchWord);
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = regexModuleForWord(searchWord);
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = regexMacroForWord(searchWord);
            // Find all sjasmplus STRUCTs in the document
            const searchsJasmStruct = regexStructForWord(searchWord);

            grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro, searchsJasmStruct])
            .then(locations => {
                reduceLocations(locations, document.fileName, position)
                .then(reducedLocations => {
                    // There should be only one location.
                    // Anyhow return the whole array.
                    resolve(reducedLocations);
                });
            });
        });

    }

}
