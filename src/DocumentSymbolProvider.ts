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
        // Loops through the whole document line by line and
        // extracts the labels.
        // Determines for each label if it is code-label,
        // a code-relative-label, an const-label (EQU) or a
        // data-label and creates symbols for each.
        // Those symbols are returned.
        let symbols=new Array<vscode.DocumentSymbol>();
        const regexLabel=/^([.a-z_@][\w.]*\b)(:?)/i;
        const regexModule=/\s+\b(module\s+([a-z_][\w\.]*)|endmodule.*)/i;
        const regexStruct=/\s+\b(struct\s+([a-z_][\w\.]*)|ends.*)/i;
        const regexNotLabels=/^(include|if|endif|else)$/i;
        const regexConst=/\b(equ)\s+(.*)/i;
        const regexData=/\b(d[bcdghmsw]|def[bdghmsw])\b\s*(.*)/i;
        let lastSymbol;
        let lastSymbols=new Array<vscode.DocumentSymbol>();
        let lastAbsSymbolChildren;
        let lastModules=new Array<vscode.DocumentSymbol>();
        let lastStructs=new Array<vscode.DocumentSymbol>();
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
                    lastSymbols.push(lastSymbol);

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

            // Now check for MODULE or STRUCT
            let matchModule=regexModule.exec(lineContents);
            if (!matchModule)
                matchModule=regexStruct.exec(lineContents);
            if (matchModule) {
                const keyword=matchModule[1].toLowerCase();
                const moduleName=matchModule[2];
                if (moduleName) {
                    // Handle MODULE
                    // Create range
                    const range=new vscode.Range(line, 0, line, 10000);
                    const selRange=range; //new vscode.Range(line, 0, line, 3);
                    // Create symbol
                    const kind=(keyword.startsWith("module"))? vscode.SymbolKind.Module:vscode.SymbolKind.Struct;
                    const moduleSymbol=new vscode.DocumentSymbol(moduleName, '', kind, range, selRange);
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
                if (keyword=="endmodule"||keyword=="ends") {
                    // Handle ENDMODULE
                    lastModules.pop();
                    lastAbsSymbolChildren=undefined;
                }

                lastSymbol=undefined;
                lastSymbols.length=0;
                continue;
            }

            /*
            // Now check for STRUCT
            const matchStruct=regexStruct.exec(lineContents);
            if (matchStruct) {
                const structName=matchStruct[2];
                if (structName) {
                    // Handle STRUCT
                    // Create range
                    const range=new vscode.Range(line, 0, line, 10000);
                    const selRange=range; 
                    // Create symbol
                    const structSymbol=new vscode.DocumentSymbol(structName, '', vscode.SymbolKind.Struct, range, selRange);
                    // Add to children of last struct
                    const len=lastStructs.length;
                    if (len>0) {
                        const lastStruct=lastStructs[len-1];
                        lastStruct.children.push(structSymbol);
                    }
                    else {
                        symbols.push(structSymbol);
                    }
                    lastStructs.push(structSymbol);
                }

                // Check for ENDS
                const structTag=matchStruct[1];
                if (structTag.toLowerCase()=="ends") {
                    // Handle ENDS
                    lastStructs.pop();
                    lastAbsSymbolChildren=undefined;
                }

                lastSymbol=undefined;
                lastSymbols.length=0;
                continue;
            }
            */
            
            // Trim
            lineContents=lineContents.trim();
            // Now check which kind of data it is:
            // code, const or data
            if (!lineContents)
                defaultSymbolKind=vscode.SymbolKind.Function;
            if (lastSymbol) {
                if (lineContents) {
                    let kind;
                    // Check for EQU
                    let match=regexConst.exec(lineContents);
                    if (match) {
                        // It's const data, e.g. EQU
                        kind=vscode.SymbolKind.Constant
                    }
                    else {
                        // Check for data
                        match=regexData.exec(lineContents);
                        if (match) {
                            // It's data data, e.g. defb
                            kind=vscode.SymbolKind.Field;
                        }
                    }
                    // Check if found
                    if (kind!=undefined) {
                        // It's something else than code
                        for (const elem of lastSymbols) {
                            elem.kind=kind;
                            elem.detail=match[1]+' '+match[2].trimRight();
                        }match
                        defaultSymbolKind=kind;
                    }
                    // Something different, so assume code
                    lastSymbol=undefined;
                    lastSymbols.length=0;
                    continue;
                }
            }
        }
        return symbols;
    }
}
