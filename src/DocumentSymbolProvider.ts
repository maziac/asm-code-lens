import * as vscode from 'vscode';
import { stripComment } from './grep';
//import { regexAnyReferenceForWord } from './regexes';



/**
 * ReferenceProvider for assembly language.
 */
export class DocumentSymbolProvider implements vscode.DocumentSymbolProvider { 

    /**
     * Called by vscode to provide symbol information for the given document.
     * I.e. returns all albels of a document.
     * 
     * @param document The document in which the command was invoked.
     * @param token A cancellation token.
     * @return An array of document highlights or a thenable that resolves to such. The lack of a result can be
     * signaled by returning `undefined`, `null`, or an empty array.
     */
    public provideDocumentSymbols(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.SymbolInformation[]|vscode.DocumentSymbol[]> {
        /*
        let symbols;
        
        if (false) {
            symbols=new Array<vscode.SymbolInformation>();
            const symbol=new vscode.SymbolInformation("Mein Name", vscode.SymbolKind.Function, "Mein Container", new vscode.Location(document.uri, new vscode.Range(10, 0, 10, 10000)));
            symbols.push(new vscode.SymbolInformation("Mein Function", vscode.SymbolKind.Function, "Mein Container", new vscode.Location(document.uri, new vscode.Range(10, 0, 10, 10000))));
            symbols.push(new vscode.SymbolInformation("Mein Variable", vscode.SymbolKind.Variable, "Mein Container2", new vscode.Location(document.uri, new vscode.Range(10, 0, 10, 10000))));
        }
        else {
            symbols=new Array<vscode.DocumentSymbol>();

            const absLabel=new vscode.DocumentSymbol("Mein Symbol/Method", "Mein Detail", vscode.SymbolKind.Method, new vscode.Range(10, 0, 10, 10000), new vscode.Range(10, 0, 10, 10000));

            absLabel.children.push(new vscode.DocumentSymbol(".label", "Mein Detail .label", vscode.SymbolKind.Method, new vscode.Range(10, 0, 10, 10000), new vscode.Range(10, 0, 10, 10000)));
                    
            symbols.push(absLabel);
        }

        return symbols;
        */
        
        // Loops through the whole document line by line and
        // extracts the labels.
        // Determines for each label if it is code-label,
        // a code-relative-label, an const-label (EQU) or a
        // data-label and creates symbols for each.
        // Those symbols are returned.
        let symbols=new Array<vscode.DocumentSymbol>();
        const regexLabel=/^([.a-z_][\w\.]*\b)(:?)/i;
        const regexNotLabels=/^(include|if|endif|else)$/i;
        const regexConst=/\s*(equ)\s+(.*)/i;
        const regexData=/\s*(d[bcdghmsw]|def[bdghmsw])\s+(.*)/i;
        let lastSymbol;
        let lastSymbols=new Array<vscode.DocumentSymbol>();
        let lastSymbolsLength=0;

        const len=document.lineCount;
        for (let line=0; line<len; line++) {
            const textLine=document.lineAt(line);
            let lineContents=stripComment(textLine.text);

            const match=regexLabel.exec(lineContents);
            if (match) {
                // It is a label
                let isLabel=true;
                const label=match[1];

                // Ignore a few false positives (for languages other than sjasmplus).
                // Required because of the sjasmplus labels without colons.
                if (!match[2]) {    // no colon after label
                    const matchNotLabel=regexNotLabels.exec(label);
                    if (matchNotLabel)
                        isLabel=false;
                }

                if (isLabel) {
                    // Create symbol
                    const range=new vscode.Range(line, 0, line, 10000);
                    const selRange=range; //new vscode.Range(line, 0, line, 3);
                    lastSymbol=new vscode.DocumentSymbol(label, '', vscode.SymbolKind.Function, range, selRange);

                    // Insert as absolute or relative label
                    if (label.startsWith('.')&&lastSymbolsLength>0) {
                        // Relative label
                        lastSymbols[lastSymbolsLength-1].children.push(lastSymbol);
                    }
                    else {
                        // Absolute label
                        symbols.push(lastSymbol);
                        lastSymbols.pop();
                        lastSymbols.push(lastSymbol);
                        lastSymbolsLength=lastSymbols.length;
                    }

                    // Remove label from line contents.
                    let len=label.length;
                    if (match[2])    // colon after label
                        len++;
                    lineContents=lineContents.substr(len);
                }
            }

            // Now check which kind of data it is:
            // code, const or data
            if (lastSymbol) {
                // Check for EQU
                const matchConstType=regexConst.exec(lineContents);
                if (matchConstType) {
                    // It's const data, e.g. EQU
                    lastSymbol.kind=vscode.SymbolKind.Constant
                    lastSymbol.detail=matchConstType[1]+' '+matchConstType[2].trimRight();
                    lastSymbol=undefined;
                    continue;
                }
                // Check for data
                const matchDataType=regexData.exec(lineContents);
                if (matchDataType) {
                    // It's data data, e.g. defb
                    lastSymbol.kind=vscode.SymbolKind.Field;
                    lastSymbol.detail=matchDataType[1]+' '+matchDataType[2].trimRight();
                    lastSymbol=undefined;
                    continue;
                }
            }
        }
        return symbols;
    }
}
