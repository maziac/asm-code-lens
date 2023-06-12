import { Config } from './config';
import { AllowedLanguageIds } from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
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
    public async provideReferences(document: vscode.TextDocument, position: vscode.Position, options: {includeDeclaration: boolean}, token: vscode.CancellationToken): Promise<vscode.Location[] | undefined> {
        // Check which workspace
        const config = Config.getConfigForDoc(document);
        if (!config?.enableFindAllReferences)
            return undefined;   // Don't show any references.

        // Search
        const posRange = document.getWordRangeAtPosition(position);
        if (!posRange) {
            return undefined;
        }
        const searchWord = document.getText(posRange);
        const searchRegex = CommonRegexes.regexAnyReferenceForWord(searchWord);

        const languageId = document.languageId as AllowedLanguageIds;
        const locations = await grep(searchRegex, config.wsFolderPath, languageId, config.excludeFiles);
        const regexLbls = CommonRegexes.regexLabel(config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, document.fileName, position, false, true, /\w/);
        return reducedLocations;
    }
}
