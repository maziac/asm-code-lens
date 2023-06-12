import { AllowedLanguageIds } from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
import { DefinitionRegexes } from './regexes/definitionregexes';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations } from './grep';
import {Config} from './config';



/**
 * DefinitionProvider for assembly language.
 * Called from vscode e.g. for "Goto definition".
 */
export class DefinitionProvider implements vscode.DefinitionProvider {
    /**
     * Called from vscode if the user selects "Goto definition".
     * @param document The current document.
     * @param position The position of the word for which the definition should be found.
     * @param options
     * @param token
     */
    public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Promise<vscode.Location[] | undefined> {
        // Check which workspace
        const config = Config.getConfigForDoc(document);
        if (!config) {
            await vscode.window.showWarningMessage("Document is in no workspace folder.");
            return undefined;
        }
        if (!config.enableGotoDefinition) {
            await vscode.window.showWarningMessage("Goto definitions are disabled for this workspace folder.");
            return undefined;
        }

        // Check for 'include "..."'
        const lineContents = document.lineAt(position.line).text;
        const match = CommonRegexes.regexInclude().exec(lineContents);
        if (match) {
            // INCLUDE found
            return this.getInclude(config, match[1]);
        }
        else {
            // Normal definition
            return this.search(config, document, position);
        }
    }


    /**
     * Searches the files that match the 'relPath' path.
     * @param config The configuration (settings).
     * @param relPath E.g. 'util/zxspectrum.inc'
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     * Points to the first line of the file.
     */
    protected async getInclude(config: Config, relPath: string): Promise<vscode.Location[]> {
        const filePattern = new vscode.RelativePattern(config.wsFolderPath, '**/' + relPath);
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
     * @param config The configuration (settings).
     * @param document The document that contains the word.
     * @param position The word position.
     * @returns A promise to an array with locations. Normally there is only one entry to the array.
     */
    protected async search(config: Config, document, position): Promise<vscode.Location[] | undefined> {
        const posRange = document.getWordRangeAtPosition(position);
        if (!posRange) {
            return undefined;
        }
        const searchWord = document.getText(posRange); //, /[a-z0-9_.]+/i));

        // Check if search word is in the excludes
        if (config.labelsExcludes.includes(searchWord))
            return undefined;  // Abort

        // Find all "something:" (labels) in the document, also labels without colon.
        const languageId = document.languageId as AllowedLanguageIds;
        const regexes = CommonRegexes.regexesLabelForWord(searchWord, config, languageId);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = CommonRegexes.regexModuleForWord(searchWord);
        regexes.push(searchSjasmModule);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = CommonRegexes.regexMacroForWord(searchWord);
        regexes.push(searchSjasmMacro);
        // Find all sjasmplus STRUCTs in the document
        const searchSjasmStruct = DefinitionRegexes.regexStructForWord(searchWord);
        regexes.push(searchSjasmStruct);

        const locations = await grepMultiple(regexes, config.wsFolderPath, document.languageId, config.excludeFiles);
        const regexLbls = CommonRegexes.regexLabel(config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, document.fileName, position, false, true, /\w/);
        // There should be only one location.
        // Anyhow return the whole array.
        return reducedLocations;
    }
}
