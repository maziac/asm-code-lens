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
        const regexLabel=/^([.a-z_@][\w.]*\b)(:?)/i;
        const regexModule=/\s+\b(module\s+([a-z_][\w.]*)|endmodule)/i;
        const regexNotLabels=/^(include|if|endif|else)$/i;
        const regexConst=/\b(equ)\s+(.*)/i;
        const regexData=/\b(d[bcdghmsw]|def[bdghmsw])\s+(.*)/i;
        let lastSymbol;
        let lastAbsSymbolChildren;
        let lastModules=new Array<vscode.DocumentSymbol>();
        let defaultSymbolKind=vscode.SymbolKind.Function;

        const len=document.lineCount;
        for (let line=0; line<len; line++) {
            const textLine=document.lineAt(line);
            let lineContents=stripComment(textLine.text);

            const match=regexLabel.exec(lineContents);
            if (match) {
                // It is a label or module (or both)
                const label=match[1];
                let isLabel=true;

                // Ignore a few false positives (for languages other than sjasmplus).
                // Required because of the sjasmplus labels without colons.
                if (!match[2]) {    // no colon after label
                    const matchNotLabel=regexNotLabels.exec(label);
                    if (matchNotLabel)
                        isLabel=false;
                }

                // First check label
                if (isLabel) {
                    // Create range
                    const range=new vscode.Range(line, 0, line, 10000);
                    const selRange=range; //new vscode.Range(line, 0, line, 3);

                    // Create Symbol
                    lastSymbol=new vscode.DocumentSymbol(label, '', defaultSymbolKind, range, selRange);

                    // Insert as absolute or relative label
                    if (label.startsWith('.')) {
                        // Relative label
                        lastAbsSymbolChildren?.push(lastSymbol);
                    }
                    else if (label.startsWith('@')) {
                        // Absolute label ignoring MODULE
                        symbols.push(lastSymbol);
                    }
                    else {
                        // Absolute label
                        // Add to children of last module
                        const len=lastModules.length;
                        if (len>0) {
                            const lastModule=lastModules[len-1];
                            lastModule.children.push(lastSymbol);
                        }
                        else {
                            symbols.push(lastSymbol);
                        }
                        lastAbsSymbolChildren=lastSymbol.children;
                    }

                    // Remove label from line contents.
                    let len=label.length;
                    if (match[2])    // colon after label
                        len++;
                    lineContents=lineContents.substr(len);
                    // Add a whitespace to recognize a directly following MODULE
                    lineContents+=' ';
                }
            }

            // Now check for MODULE
            const matchModule=regexModule.exec(lineContents);
            if (matchModule) {
                const moduleName=matchModule[2];
                if (moduleName) {
                    // Handle MODULE
                    // Create range
                    const range=new vscode.Range(line, 0, line, 10000);
                    const selRange=range; //new vscode.Range(line, 0, line, 3);
                    // Create symbol
                    const moduleSymbol=new vscode.DocumentSymbol(moduleName, '', vscode.SymbolKind.Module, range, selRange);
                    // Add to children of last module
                    const len=lastModules.length;
                    if (len>0) {
                        const lastModule=lastModules[len-1];
                        lastModule.children.push(moduleSymbol);
                    }
                    else {
                        symbols.push(moduleSymbol);
                    }
                    lastModules.push(moduleSymbol);
                }

                // Check for ENDMODULE
                const moduleTag=matchModule[1];
                if (moduleTag.toLowerCase()=="endmodule") {
                    // Handle ENDMODULE
                    lastModules.pop();
                    lastAbsSymbolChildren=undefined;
                }

                lastSymbol=undefined;
                continue;
            }
        
            // Trim
            lineContents=lineContents.trim();
            // Now check which kind of data it is:
            // code, const or data
            if (!lineContents)
                defaultSymbolKind=vscode.SymbolKind.Function;
            if (lastSymbol) {
                if (lineContents) {
                    // Check for EQU
                    const matchConstType=regexConst.exec(lineContents);
                    if (matchConstType) {
                        // It's const data, e.g. EQU
                        lastSymbol.kind=vscode.SymbolKind.Constant
                        lastSymbol.detail=matchConstType[1]+' '+matchConstType[2].trimRight();
                        defaultSymbolKind=lastSymbol.kind;
                        lastSymbol=undefined;
                        continue;
                    }
                    // Check for data
                    const matchDataType=regexData.exec(lineContents);
                    if (matchDataType) {
                        // It's data data, e.g. defb
                        lastSymbol.kind=vscode.SymbolKind.Field;
                        lastSymbol.detail=matchDataType[1]+' '+matchDataType[2].trimRight();
                        defaultSymbolKind=lastSymbol.kind;
                        lastSymbol=undefined;
                        continue;
                    }
                    // Something different, so assume code
                    lastSymbol=undefined;
                    continue;
                }
            }
        }
        return symbols;
    }
}
