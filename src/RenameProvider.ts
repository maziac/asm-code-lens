'use strict';
import * as vscode from 'vscode';
import { grep } from './grep';



/**
 * RenameProvider for assembly language.
 */
export class RenameProvider implements vscode.RenameProvider {
    /**
     * Called from vscode if the used selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options 
     * @param token 
     */
    public provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Thenable<vscode.WorkspaceEdit> {

        return new Promise<vscode.WorkspaceEdit>((resolve,reject) => {
            const oldName = document.getText(document.getWordRangeAtPosition(position));
            return resolve(this.rename(oldName, newName));
        });
    }

    
    /**
     * Searches for oldNamein all files and replaces it with newName.
     * @param oldName The name to replace.
     * @param newName The new name.
     */
    public rename(oldName: string, newName: string): Thenable<vscode.WorkspaceEdit> {
        return new Promise<vscode.WorkspaceEdit>((resolve, reject) => {
            const searchRegex = new RegExp('\\b' + oldName + '\\b');

            grep({ regex: searchRegex })
            .then(locations => {
                // Change to WorkSpaceEdits.
                const wsEdit = new vscode.WorkspaceEdit();
                for(const loc of locations) {
                    wsEdit.replace(loc.uri, loc.range, newName);
                }
                
                return resolve(wsEdit);
            });
        });
    }

}
