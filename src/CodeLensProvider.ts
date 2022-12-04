import * as vscode from 'vscode';
import {AllowedLanguageIds} from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
import {grep, grepTextDocumentMultiple, reduceLocations} from './grep';
import {Config} from './config';
import {DonateInfo} from './donate/donateinfo';



/**
 * A CodeLens for the assembler files.
 * Extends CodeLens by the TextDocument.
 */
class AsmCodeLens extends vscode.CodeLens {
    public config: any; // TODO
    public document: vscode.TextDocument;
    public symbol: string;  // The searched symbol (text).

    /**
     * Constructor.
     * @param doc The corresponding TextDocument.
     * @param range The range in the TextDocument.
     * @param matchedText The matchedText, i.e. the symbol.
     */
    constructor(config: any, doc: vscode.TextDocument, range: vscode.Range, matchedText: string) {
        super(range);
        this.config = config;
        this.document = doc;
        this.symbol = matchedText;
    }
}


/**
 * CodeLensProvider for assembly language.
 */
export class CodeLensProvider implements vscode.CodeLensProvider {
    /**
     * Constructor.
     * @param config The configuration (preferences) to use.
     */
    //constructor() {
    //}


    /**
     * Called from vscode to provide the code lenses.
     * Code lenses are provided unresolved.
     * It searches the given document for symbols (strings which ends with ":")
     * and creates a code lens for each.
     * @param document The document to check.
     * @param token
     */
    public async provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.CodeLens[] | undefined> {
        // Show donate info
        DonateInfo.checkDonateInfo();   // No need for 'await'.

        // Check which workspace
        const config = Config.getConfigForDoc(document);
        if (!config?.enableCodeLenses)
            return undefined;   // Don't show code lenses at all.

        // Find all code lenses
        const languageId = document.languageId as AllowedLanguageIds;

        const fsPath = document.uri.fsPath;
        console.log(fsPath);
        const codeLenses: Array<vscode.CodeLens> = [];
        const regexes = CommonRegexes.regexesLabel(config, languageId);
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
            if (!config.labelsExcludes.includes(trimmedMatchedText.toLowerCase())) {
                // Create code lens
                const startPos = new vscode.Position(lineNr, colStart);
                const endPos = new vscode.Position(lineNr, colEnd);
                const range = new vscode.Range(startPos, endPos);
                const codeLense = new AsmCodeLens(config, document, range, trimmedMatchedText);
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
        //console.log('*****************************************');
        //console.log('resolveCodeLens start: ', codeLens.document.uri.fsPath);
        // Search the references
        const searchWord = codeLens.symbol;
        const searchRegex = CommonRegexes.regexAnyReferenceForWord(searchWord);
        //console.log('searchWord', searchWord);

        const doc = codeLens.document;
        const pos = codeLens.range.start;
        const config: Config = codeLens.config;

        const languageId = doc.languageId as AllowedLanguageIds;
        const locations = await grep(searchRegex, config.wsFolderPath, languageId, config.excludeFiles);
        // Remove any locations because of module information (dot notation)
        const regexLbls = CommonRegexes.regexesLabel(config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, doc.fileName, pos, true, true);
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
