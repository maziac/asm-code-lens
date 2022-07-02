import { AllowedLanguageIds } from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
import * as vscode from 'vscode';
import { grep, reduceLocations } from './grep';



/**
 * ReferenceProvider for assembly language.
 */
export class ReferenceProvider implements vscode.ReferenceProvider {
    protected rootFolder: string;   // The root folder of the project.


    /**
     * Constructor.
     * @param rootFolder Stores the root folder for multiroot projects.
     */
    constructor(rootFolder: string) {
        // Store
        this.rootFolder = rootFolder;
    }


    /**
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options
     * @param token
     */
    public async provideReferences(document: vscode.TextDocument, position: vscode.Position, options: {includeDeclaration: boolean}, token: vscode.CancellationToken): Promise<vscode.Location[]> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (docPath.indexOf(this.rootFolder) < 0)
                return [];   // Skip because path belongs to different workspace
        // Path is from right project -> search
        return this.search(document, position);
    }


    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     */
    protected async search(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location[]> {
        const searchWord = document.getText(document.getWordRangeAtPosition(position));
        const searchRegex = CommonRegexes.regexAnyReferenceForWord(searchWord);

        const languageId = document.languageId as AllowedLanguageIds;
        const locations = await grep(searchRegex, this.rootFolder, languageId);
        const reducedLocations = await reduceLocations(locations, document.fileName, position, false, true, /\w/);
        return reducedLocations;
    }

}
