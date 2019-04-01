'use strict';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations, getCompleteLabel, getLastLabelPart } from './grep';



/**
 * CompletionItemProvider for assembly language.
 */
export class CompletionItemProvider implements vscode.CompletionItemProvider { 
    /**
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param token 
     */
    public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken,
		context: vscode.CompletionContext
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const settings = vscode.workspace.getConfiguration('asm-code-lens');
        if(settings.enableCompletionItemsProvider != undefined 
            && !settings.enableCompletionItemsProvider)
            return undefined;

        const line = document.lineAt(position).text;
        const {label} = getCompleteLabel(line, position.character);
        console.log('provideCompletionItems:', label);
        if(label.length < 2)
            return new vscode.CompletionList([new vscode.CompletionItem(' ')], false);  // A space is required, otherwise vscode will not ask again for comletion items.

        // Search proposals
        return this.propose(document, position);
     }


    /**
     * Proposes a list of labels etc.
     * @param document The document that contains the word.
     * @param position The word position.
     */
    protected propose(document: vscode.TextDocument, position: vscode.Position): Thenable<vscode.CompletionList>
    {
        return new Promise<vscode.CompletionList>((resolve, reject) => {
            const text = document.getText(document.getWordRangeAtPosition(position));

            // Search
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            // Find all "something:" (labels) in the document
            const searchNormal = new RegExp('^(\\s*)[\\w\\.]*\\b' + searchWord + '[\\w\\.]*:', 'i');
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = new RegExp('^()[\\w\\.]*\\b' + searchWord + '\\b(?![:\._])', 'i');
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = new RegExp('^(\\s+MODULE\\s)' + searchWord + '\\b', 'i');
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = new RegExp('^(\\s+MACRO\\s)' + searchWord + '\\b', 'i');

            //grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro])
            grepMultiple([searchNormal])
            .then(locations => {
                // Reduce the found locations.
                reduceLocations(locations, document, position, false, false)
                .then(reducedLocations => {
                    // Now put all propsal texts in a list.
                    const proposals: vscode.CompletionItem[] = [];
                    for(const loc of reducedLocations) {
                        const text = loc.moduleLabel;
                        console.log('Proposal:', text);
                        const item = new vscode.CompletionItem(text);
                        item.insertText = getLastLabelPart(text);
                        proposals.push(item);
                    }
                    
                    // Return
                    const completionList = new vscode.CompletionList(proposals, true); // TODO: true or false???
                    resolve(completionList);
                });
            });
        });
    }

}
