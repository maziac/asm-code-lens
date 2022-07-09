import { AllowedLanguageIds } from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
import * as vscode from 'vscode';
import {grepMultiple, reduceLocations, getCompleteLabel} from './grep';
import * as fs from 'fs';
import {Config} from './config';
import {readCommentsForLine} from './comments';


/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {
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
     * Called from vscode if the user hovers over a word.
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options
     * @param token
     */
    public async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (!docPath.includes(this.config.rootFolder))
            return undefined as any; // Path is wrong.
        // Right path.
        return this.search(document, position);
    }


    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     * @return A promise with a vscode.Hover object.
     */
    protected async search(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Hover> {
        // Check for local label
        const regexEnd = /\w/;
        const lineContents = document.lineAt(position.line).text;
        const {label} = getCompleteLabel(lineContents, position.character, regexEnd);
        //console.log("provideHover", this.rootFolder, document.uri.fsPath, "'" + label + "'");
        if (label.startsWith('.')) {
            return new vscode.Hover('');
        }

        // It is a non local label
        const languageId = document.languageId as AllowedLanguageIds;
        const range = document.getWordRangeAtPosition(position);
        const searchWord = document.getText(range);
        // regexes for labels with and without colon
        const regexes = CommonRegexes.regexesLabelForWord(searchWord, this.config, languageId);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = CommonRegexes.regexModuleForWord(searchWord);
        regexes.push(searchSjasmModule);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = CommonRegexes.regexMacroForWord(searchWord);
        regexes.push(searchSjasmMacro);

        const locations = await grepMultiple(regexes, this.config.rootFolder, languageId);
        // Reduce the found locations.
        const regexLbls = CommonRegexes.regexesLabel(this.config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, document.fileName, position, false, true, regexEnd);

        // Now read the comment lines above the document.
        // Normally there is only one but e.g. if there are 2 modules with the same name there could be more.
        const hoverTexts = new Array<vscode.MarkdownString>();
        // Check for end
        for (const loc of reducedLocations) {
            // Check if included in exclusion list
            const name = loc.moduleLabel;
            if (this.config.labelsExcludes.includes(name))
                continue;
            // Get comments
            const lineNr = loc.range.start.line;
            const filePath = loc.uri.fsPath;
            const linesData = fs.readFileSync(filePath, {encoding: 'utf-8'});
            const lines = linesData.split('\n');

            // Now find all comments above the found line
            const foundTexts = readCommentsForLine(lines, lineNr);
            if (foundTexts.length > 0) {
                // Separate several found texts
                if (hoverTexts.length > 0)
                    hoverTexts.push(new vscode.MarkdownString('============'));
                // Add text
                hoverTexts.push(...foundTexts.map(line => new vscode.MarkdownString(line)));
            }
        }

        // End of processing.
        // Check if 0 entries
        if (hoverTexts.length == 0)
            return undefined as any;  // Nothing found

        // return
        const hover = new vscode.Hover(hoverTexts);
        return hover;
    }

}
