'use strict';
import * as vscode from 'vscode';
import { grep, grepTextDocument, read, reduceLocations } from './grep';
import * as fs from 'fs';
import * as path from 'path';
import { ReferenceProvider } from './ReferenceProvider';


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
    constructor(doc:vscode.TextDocument, range: vscode.Range, matchedText: string) {
        super(range);
        this.document = doc;
        this.symbol = matchedText;
    }
}


/**
 * CodeLensProvider for assembly language.
 */
export class CodeLensProvider implements vscode.CodeLensProvider {

    /**
     * Called from vscode to provide the code lenses.
     * Code lenses are provided unresolved.
     * It searches the given document for symbols (strings which ends with ":")
     * and creates a code lens for each.
     * @param document The document to check.
     * @param token 
     */
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.CodeLens[]> { // oder Promise<CodeLens[]>
    
        return new Promise<vscode.CodeLens[]>((resolve, reject) => {
            // Find all "something:" (labels) in the document
            const searchRegex = /^\s*\b\w+:/;
            const matches = grepTextDocument(document, searchRegex);
            // Loop all matches and create code lenses
            const codeLenses = new Array<vscode.CodeLens>();
            for(const match of matches) {
                // Create codeLens
                const lineNr = match.line;
                const colStart = match.start;
                const colEnd = match.end;
                const lineContents = document.lineAt(lineNr).text;
                const matchedText = lineContents.substr(colStart, colEnd-colStart-1);
                const trimmedMatchedText = matchedText.trim();
                const startPos = new vscode.Position(lineNr, colStart);
                const endPos = new vscode.Position(lineNr, colEnd);
                const range = new vscode.Range(startPos, endPos); 
                const codeLense = new AsmCodeLens(document, range, trimmedMatchedText);
                // Store
                codeLenses.push(codeLense);
            }

            // Find all sjasmplus labels without ":" in the document
            const searchRegex2 = /^\b\w+([^:\w]|$)/;
            const matches2 = grepTextDocument(document, searchRegex2);
            // Loop all matches and create code lenses
            for(const match of matches2) {
                // Create codeLens
                const lineNr = match.line;
                const colStart = match.start;
                const colEnd = match.end;
                const lineContents = document.lineAt(lineNr).text;
                const matchedText = lineContents.substr(colStart, colEnd-colStart-1);
                const trimmedMatchedText = matchedText.trim();
                const startPos = new vscode.Position(lineNr, colStart);
                const endPos = new vscode.Position(lineNr, colEnd);
                const range = new vscode.Range(startPos, endPos); 
                const codeLense = new AsmCodeLens(document, range, trimmedMatchedText);
                // Store
                codeLenses.push(codeLense);
            }
            return resolve(codeLenses);
        });
    }


    /**
     * Called by vscode if the codelens should be resolved (displayed).
     * The symbol (matchedText) is searched and the count of references is
     * presented with the text "n references".
     * @param codeLens An AsmCodeLens object which also includes the symbol and the document.
     * @param token 
     */
    public resolveCodeLens?(codeLens: AsmCodeLens, token: vscode.CancellationToken): Thenable<vscode.CodeLens> {
        return new Promise<vscode.CodeLens>((resolve, reject) => {
            // search the references
            const searchWord = codeLens.symbol;
            const searchRegex = new RegExp('^([^;"]*)\\b' + searchWord + '\\b');

            const doc = codeLens.document;
            const pos = codeLens.range.start;
            const line = pos.line;

            grep({ regex: searchRegex })
            .then(locations => {
                // Remove any locations because of module information (dot notation)
                reduceLocations(locations, doc, pos)
                .then(reducedLocations => {
                    // create title
                    const count = reducedLocations.length;
                    let title = count + ' reference';
                    if(count != 1)
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
                    return resolve(codeLens); 
                });
            });

        });
    }
    
}
