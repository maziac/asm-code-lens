import * as vscode from 'vscode';
import {grepMultiple, reduceLocations, getCompleteLabel} from './grep';
import {regexModuleForWord, regexMacroForWord, regexesLabelForWord} from './regexes';
import * as fs from 'fs';
import {Config} from './config';


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
        const range = document.getWordRangeAtPosition(position);
        const searchWord = document.getText(range);
        // regexes for labels with and without colon
        const regexes = regexesLabelForWord(searchWord, this.config);
        // Find all sjasmplus MODULEs in the document
        const searchSjasmModule = regexModuleForWord(searchWord);
        regexes.push(searchSjasmModule);
        // Find all sjasmplus MACROs in the document
        const searchSjasmMacro = regexMacroForWord(searchWord);
        regexes.push(searchSjasmMacro);

        const locations = await grepMultiple(regexes, this.config.rootFolder);
        // Reduce the found locations.
        const reducedLocations = await reduceLocations(locations, document.fileName, position, false, true, regexEnd);
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
            const prevHoverTextArrayLength = hoverTexts.length;
            const text = lines[lineNr];
            const textMd = new vscode.MarkdownString();
            textMd.appendText(text);
            if (text.indexOf(';') >= 0 || text.toLowerCase().indexOf('equ') >= 0) // REMARK: This can lead to error: "indexOf of undefined"
                hoverTexts.unshift(textMd);
            let startLine = lineNr - 1;
            while (startLine >= 0) {
                // Check if line starts with ";"
                const line = lines[startLine];
                const match = /^\s*;(.*)/.exec(line);
                if (!match)
                    break;
                // Add text
                const textMatch = new vscode.MarkdownString();
                textMatch.appendText(match[1]);
                hoverTexts.unshift(textMatch);
                // Next
                startLine--;
            }

            // Separate several entries
            if (prevHoverTextArrayLength != hoverTexts.length)
                hoverTexts.unshift(new vscode.MarkdownString('============'));
        }

        // End of processing.
        // Check if 0 entries
        if (hoverTexts.length == 0)
            return undefined as any;  // Nothing found

        // Remove first ('============');
        hoverTexts.splice(0, 1);

        // return
        const hover = new vscode.Hover(hoverTexts);
        return hover;
    }

}
