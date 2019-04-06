'use strict';
import * as vscode from 'vscode';
import { grepMultiple, reduceLocations, getCompleteLabel, GrepLocation, getModule, getNonLocalLabel, removeDuplicates } from './grep';
import { CodeLensProvider } from './CodeLensProvider';
import { stringify } from 'querystring';



/**
 * CompletionItemProvider for assembly language.
 */
export class CompletionProposalsProvider implements vscode.CompletionItemProvider { 
    /**
     * Called from vscode if the user selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param token 
     */
    public provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        const settings = vscode.workspace.getConfiguration('asm-code-lens');
        if(settings.enableCompletions != undefined 
            && !settings.enableCompletions)
            return undefined;

        // Get required length
        let requiredLen = settings.completionsRequiredLength;
        if(requiredLen == undefined || requiredLen < 1)
            requiredLen = 1;

        const line = document.lineAt(position).text;
        const {label} = getCompleteLabel(line, position.character);
        //console.log('provideCompletionItems:', label);
        let len = label.length;
        if(label.startsWith('.'))
            len --; // Require one more character for local labels.
        if(len < requiredLen)
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
            // Get all lines
            const lines = document.getText().split('\n');
            // Get the module at the line of the searched word.
            const row = position.line;
            const moduleLabel = getModule(lines, row);
            
            // Get the range of the whole input label.
            // Otherwise vscode takes only the part after the last dot.
            const lineContents = lines[row];
            const {label, preString} = getCompleteLabel(lineContents, position.character);
            const start = preString.length;
            const end = start + label.length;
            const range = new vscode.Range(new vscode.Position(row, start), new vscode.Position(row, end));

            // get the first non-local label
            let nonLocalLabel;  // Only used for local labels
            if(label.startsWith('.')) {
                nonLocalLabel = getNonLocalLabel(lines, row);
            }

            // Search
            let searchWord = document.getText(document.getWordRangeAtPosition(position));
            searchWord = searchWord.replace(/(.)/g,'\\w*$1');
            // Find all "something:" (labels) in the document
            const searchNormal = new RegExp('^(\\s*[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
            // Find all sjasmplus labels without ":" in the document
            const searchSjasmLabel = new RegExp('^([\\w\\.]*)\\b' + searchWord + '[\\w\\.]*\\b(?![:\\.])', 'i'); 
            // Find all sjasmplus MODULEs in the document
            const searchsJasmModule = new RegExp('^(\\s+MODULE\\s+)' + searchWord + '[\\w\\.]*', 'i');
            // Find all sjasmplus MACROs in the document
            const searchsJasmMacro = new RegExp('^(\\s+MACRO\\s+)' + searchWord + '[\\w\\.]*', 'i');

            grepMultiple([searchNormal, searchSjasmLabel, searchsJasmModule, searchsJasmMacro])
            //grepMultiple([searchNormal])
            .then(locations => {
                // Reduce the found locations.
                reduceLocations(locations, document.fileName, position, true, false)
                .then(reducedLocations => {
                    // Now put all propsal texts in a list.
                    const proposals: vscode.CompletionItem[] = [];
                    for(const loc of reducedLocations) {
                        const text = loc.moduleLabel;
                        //console.log('\n');
                        //console.log('Proposal:', text);
                        const item = new vscode.CompletionItem(text, vscode.CompletionItemKind.Function);
                        item.filterText = text;
                        item.range = range;

                        // Check for local label
                        if(nonLocalLabel) {
                            // A previous non-local label was searched (and found), so label is local.
                            item.filterText = label;
                            // Change insert text
                            const k = moduleLabel.length + 1 + nonLocalLabel.length;
                            let part = text.substr(k);
                            item.insertText = part;
                            // change shown text
                            item.label = part;
                            // And filter text
                            item.filterText = part;
                        }
                        // Maybe make the label local to current module.
                        else if(text.startsWith(moduleLabel+'.')) {
                            // Change insert text
                            const k = moduleLabel.length + 1;
                            let part = text.substr(k);
                            item.insertText = part;
                            // change shown text
                            item.label = '['+text.substr(0,k)+'] '+part;
                        }
                        
                        proposals.push(item);
                    }
                    
                    // Return
                    const completionList = new vscode.CompletionList(proposals, false); // TODO: true or false???
                    resolve(completionList);
                });
            });
        });
    }

}
