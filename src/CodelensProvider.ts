'use strict';
import * as vscode from 'vscode';
import { grep, grepTextDocument, read } from './grep';
import * as fs from 'fs';
import * as path from 'path';
import { ReferenceProvider } from './ReferenceProvider';


/**
 * A CodeLens for the assembler files.
 * Extends CodeLens by the TextDocument.
 */
class AsmCodeLens extends vscode.CodeLens {
    public document: vscode.TextDocument;
    public matchedText: string;

    /**
     * Constructor.
     * @param doc The corresponding TextDocument.
     * @param range The range in the TextDocument.
     * @param matchedText The matchedText, i.e. the symbol.
     */
    constructor(doc:vscode.TextDocument, range: vscode.Range, matchedText: string) {
        super(range);
        this.document = doc;
        this.matchedText = matchedText;
    }
}


/**
 * CodeLensProvider for assembly language.
 */
export class CodeLensProvider implements vscode.CodeLensProvider {
    
    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.CodeLens[]> { // oder Promise<CodeLens[]>
    
        return new Promise<vscode.CodeLens[]>((resolve, reject) => {
            // Find all "something:" (labels) in the document
            const searchRegex = /^\s*\b\w+:/;
            const matches = grepTextDocument(document, searchRegex);
            // Loop all matches and create code lenses
            // TODO: need to find corresponding CALLs
            const codeLenses = new Array<vscode.CodeLens>();
            for(const match of matches) {
                // Create codeLens
                const lineNr = match.line;
                const colStart = match.start;
                const colEnd = match.end;
                const matchedText = match.matchedText;
                const startPos = new vscode.Position(lineNr, colStart);
                const endPos = new vscode.Position(lineNr, colEnd);
                const range = new vscode.Range(startPos, endPos); 
                const codeLense = new AsmCodeLens(document, range, matchedText);
                // Store
                codeLenses.push(codeLense);
            }
            return resolve(codeLenses);
        });
    }

    public resolveCodeLens?(codeLens: AsmCodeLens, token: vscode.CancellationToken): Thenable<vscode.CodeLens> {
        return new Promise<vscode.CodeLens>((resolve, reject) => {
            // search the references
            const doc = codeLens.document;
            const pos = codeLens.range.start;
            const refProvider = new ReferenceProvider();
            refProvider.search(doc, pos)
            .then(locations => {
                codeLens.command = {
                    title: "x references",
                    command: 'editor.action.showReferences',
                    arguments: [
                        doc.uri, // uri
                        pos, // position
                        locations //reference locations
                    ]
                };
                return resolve(codeLens);     
            });
        });
    }
    
}
