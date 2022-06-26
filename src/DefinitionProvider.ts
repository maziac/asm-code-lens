import * as vscode from 'vscode';
import { grepMultiple, reduceLocations } from './grep';
//import { resolve } from 'path';
import {regexInclude, regexModuleForWord, regexMacroForWord, regexStructForWord, regexesLabelForWord} from './regexes';
import {Config} from './config';



/**
 * DefinitionProvider for assembly language.
 * Called from vscode e.g. for "Goto definition".
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
    // The configuration to use.
    protected config: Config;


    /**
     * Constructor.
     * @param config The configuration (preferences) to use.
     */
    constructor(config: Config) {
        // Store
        this.config = config;
    }


    /**
     * Called from vscode if the user selects "Goto definition".
     * @param document The current document.
     * @param position The position of the word for which the definition should be found.
     * @param options
     * @param token
     */
    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location[]> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (!docPath.includes(this.config.rootFolder))
            return []; // Path is wrong.
        // Check for 'include "..."'
        const lineContents = document.lineAt(position.line).text;
        const match = regexInclude().exec(lineContents);
        if (match) {
            // INCLUDE found
            return this.getInclude(match[1]);
        }
        else {
            // Normal definition
            return this.search(document, position);
        }
    }


    /**
     * Searches the files that match the 'relPath' path.
     * @param relPath E.g. 'util/zxspectrum.inc'
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     * Points to the first line of the file.
     */
    protected async getInclude(relPath: string): Promise<vscode.Location[]> {
        const filePattern = new vscode.RelativePattern(this.config.rootFolder, '**/' + relPath);
        const uris = await vscode.workspace.findFiles(filePattern, null);
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

        // Check if search word is in the excludes
        if (this.config.labelsExcludes.includes(searchWord))
            return [];  // Abort

        // Find all "something:" (labels) in the document, also labels without colon.
        const regexes = regexesLabelForWord(searchWord, this.config);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = regexModuleForWord(searchWord);
        regexes.push(searchSjasmModule);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = regexMacroForWord(searchWord);
        regexes.push(searchSjasmMacro);
        // Find all sjasmplus STRUCTs in the document
        const searchSjasmStruct = regexStructForWord(searchWord);
        regexes.push(searchSjasmStruct);

        const locations = await grepMultiple(regexes, this.config.rootFolder, document.languageId);
        const reducedLocations = await reduceLocations(locations, document.fileName, position, false, true, /\w/);
        // There should be only one location.
        // Anyhow return the whole array.
        return reducedLocations;
    }
}
