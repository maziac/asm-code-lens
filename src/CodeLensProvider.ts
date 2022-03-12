import * as vscode from 'vscode';
import {grep, grepTextDocumentMultiple, reduceLocations} from './grep';
import {regexAnyReferenceForWord, regexesLabel} from './regexes';
import {Config} from './config';


/**
 * A CodeLens for the assembler files.
 * Extends CodeLens by the TextDocument.
 */
class AsmCodeLens extends vscode.CodeLens {
    public document: vscode.TextDocument;
    public symbol: string;  // The searched symbol (text).

    /**
     * Constructor.
     * @param doc The corresponding TextDocument.
     * @param range The range in the TextDocument.
     * @param matchedText The matchedText, i.e. the symbol.
     */
    constructor(doc: vscode.TextDocument, range: vscode.Range, matchedText: string) {
        super(range);
        this.document = doc;
        this.symbol = matchedText;
    }
}


/**
 * CodeLensProvider for assembly language.
 */
export class CodeLensProvider implements vscode.CodeLensProvider {
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
     * Called from vscode to provide the code lenses.
     * Code lenses are provided unresolved.
     * It searches the given document for symbols (strings which ends with ":")
     * and creates a code lens for each.
     * @param document The document to check.
     * @param token
     */
    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[]> {
        // First check for right path
        const docPath = document.uri.fsPath;
        if (docPath.indexOf(this.config.rootFolder) < 0)
            return [];

        // Find all code lenses
        const codeLenses: Array<vscode.CodeLens> = [];
        const regexes = regexesLabel(this.config);
        const matches = grepTextDocumentMultiple(document, regexes);
        // Loop all matches and create code lenses
        for (const fmatch of matches) {
            // Create codeLens
            const lineNr = fmatch.line;
            const colStart = (fmatch.match[1]) ? fmatch.match[1].length : 0;
            let colEnd = fmatch.end;
            const lineContents = document.lineAt(lineNr).text;
            let matchedText = lineContents.substring(colStart, colEnd);
            if (matchedText.endsWith(':')) {
                colEnd--;
                matchedText = matchedText.substring(0, matchedText.length - 1);
            }
            const trimmedMatchedText = matchedText.trim();
            // Check that label is not excluded
            if (!this.config.labelsExcludes.includes(trimmedMatchedText.toLowerCase())) {
                // Create code lens
                const startPos = new vscode.Position(lineNr, colStart);
                const endPos = new vscode.Position(lineNr, colEnd);
                const range = new vscode.Range(startPos, endPos);
                const codeLense = new AsmCodeLens(document, range, trimmedMatchedText);
                // Store
                codeLenses.push(codeLense);
            }
        }

        return codeLenses;
    }


    /**
     * Called by vscode if the codelens should be resolved (displayed).
     * The symbol (matchedText) is searched and the count of references is
     * presented with the text "n references".
     * @param codeLens An AsmCodeLens object which also includes the symbol and the document.
     * @param token
     */
    public async resolveCodeLens?(codeLens: AsmCodeLens, token: vscode.CancellationToken): Promise<vscode.CodeLens> {
        // Search the references
        const searchWord = codeLens.symbol;
        const searchRegex = regexAnyReferenceForWord(searchWord);

        const doc = codeLens.document;
        const pos = codeLens.range.start;
        //const line = pos.line;

        const locations = await grep(searchRegex, this.config.rootFolder);
        // Remove any locations because of module information (dot notation)
        const reducedLocations = await reduceLocations(locations, doc.fileName, pos)
        // create title
        const count = reducedLocations.length;
        let title = count + ' reference';
        if (count != 1)
            title += 's';
        // Add command to show the references (like in "find all references")
        codeLens.command = {
            title: title,
            command: 'editor.action.showReferences',
            arguments: [
                doc.uri, // uri
                pos, // position
                reducedLocations //reference locations
            ]
        };
        return codeLens;
    }

}
