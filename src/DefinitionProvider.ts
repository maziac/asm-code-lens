import * as vscode from 'vscode';
import * as path from 'path';
import { grepMultiple, reduceLocations } from './grep';
//import { resolve } from 'path';
import {regexInclude, regexLabelColonForWord, regexLabelWithoutColonForWord, regexModuleForWord, regexMacroForWord, regexStructForWord} from './regexes';



/**
 * DefinitionProvider for assembly language.
 * Called from vscode e.g. for "Goto definition".
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
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
     * Called from vscode if the used selects "Goto definition".
     * @param document The current document.
     * @param position The position of the word for which the definition should be found.
     * @param options
     * @param token
     */
    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[]> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (docPath.indexOf(this.rootFolder) < 0)
            return []; // Path is wrong.
        // Check for 'include "..."'
        const lineContents = document.lineAt(position.line).text;
        const match = regexInclude().exec(lineContents);
        if (match) {
            // INCLUDE found
            return await this.getInclude(match[1]);
        }
        else {
            // Normal definition
            return await this.search(document, position);
        }
    }


    /**
     * Searches the files that match the 'relPath' path.
     * @param relPath E.g. 'util/zxspectrum.inc'
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     * Points to the first line of the file.
     */
    protected async getInclude(relPath: string): Promise<vscode.Location[]> {
        const uris = await vscode.workspace.findFiles(this.rootFolder + '**/' + relPath, null);
        const locations: vscode.Location[] = [];
        const pos = new vscode.Position(0, 0);
        const range = new vscode.Range(pos, pos);
        for (const uri of uris) {
            const loc = new vscode.Location(uri, range);
            locations.push(loc);
        }
        return locations;
    }


    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     */
    protected async search(document, position): Promise<vscode.Location[]> {
        const searchWord = document.getText(document.getWordRangeAtPosition(position)); //, /[a-z0-9_.]+/i));
        // Find all "something:" (labels) in the document
        const searchNormal = regexLabelColonForWord(searchWord);
        // Find all sjasmplus labels without ":" in the document
        const searchSjasmLabel = regexLabelWithoutColonForWord(searchWord);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = regexModuleForWord(searchWord);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = regexMacroForWord(searchWord);
        // Find all sjasmplus STRUCTs in the document
        const searchSjasmStruct = regexStructForWord(searchWord);

        // Put all searches in one array
        const searchRegexes = [searchNormal, searchSjasmLabel, searchSjasmModule, searchSjasmMacro, searchSjasmStruct];

        const locations = await grepMultiple(searchRegexes, this.rootFolder);
        const reducedLocations = await reduceLocations(locations, document.fileName, position);
        // There should be only one location.
        // Anyhow return the whole array.
        return reducedLocations;
    }
}
