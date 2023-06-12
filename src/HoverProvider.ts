import * as vscode from 'vscode';
import {AllowedLanguageIds} from './languageId';
import {CommonRegexes} from './regexes/commonregexes';
import {grepMultiple, reduceLocations} from './grep';
import {Config} from './config';
import {readCommentsForLine} from './comments';
import {getCompleteLabel} from './grepextra';


/**
 * HoverProvider for assembly language.
 */
export class HoverProvider implements vscode.HoverProvider {
    /**
     * Called from vscode if the user hovers over a word.
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options
     * @param token
     */
    public async provideHover(document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): Promise<vscode.Hover | undefined> {
        // Check which workspace
        const config = Config.getConfigForDoc(document);
        if (!config?.enableHovering)
            return undefined;   // Don't show any hover.

        // Search the word:

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
        if (!range) {
            //console.log("provideHover", position);
            return undefined;
        }

        const searchWord = document.getText(range);
        // regexes for labels with and without colon
        const regexes = CommonRegexes.regexesLabelForWord(searchWord, config, languageId);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = CommonRegexes.regexModuleForWord(searchWord);
        regexes.push(searchSjasmModule);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = CommonRegexes.regexMacroForWord(searchWord);
        regexes.push(searchSjasmMacro);

        const locations = await grepMultiple(regexes, config.wsFolderPath, languageId, config.excludeFiles);
        // Reduce the found locations.
        const regexLbls = CommonRegexes.regexLabel(config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, document.fileName, position, false, true, regexEnd);

        // Now read the comment lines above the document.
        // Normally there is only one but e.g. if there are 2 modules with the same name there could be more.
        const hoverTexts = new Array<vscode.MarkdownString>();
        // Check for end
        for (const loc of reducedLocations) {
            // Check if included in exclusion list
            const name = loc.moduleLabel;
            if (config.labelsExcludes.includes(name))
                continue;
            // Get comments
            const lineNr = loc.range.start.line;
            const filePath = loc.uri.fsPath;
            const doc = await vscode.workspace.openTextDocument(filePath);
            const linesData = doc.getText();
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
            return undefined;  // Nothing found

        // return
        const hover = new vscode.Hover(hoverTexts);
        return hover;
    }

}
