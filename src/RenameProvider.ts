'use strict';
import * as vscode from 'vscode';
import { grep, read } from './grep';
import * as fs from 'fs';



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
            const searchRegex = new RegExp('\\b' + oldName + '\\b', 'g');

            grep({ regex: searchRegex })
            .then(locations => {
                // Change to WorkSpaceEdits.
                // Note: WorkSpaceEdits do work on all (even not opened files) in the workspace.
                // However the problem is that the a file which is not yet open would be
                // opened by the WorkSpaceEdit and stay there unsaved.
                // Therefore I try beforehand to find out which documents are already opened and
                // handle the unopened files differently.
                // The problem is: there is no way to find out the opened documents.
                // The only available information are the dirty docs. I.e. those are opened.
                // And only those are changed with WorkSpaceEdits.
                // The other, undirty opened docs and unopened docs, are changed on disk.
                // For the undirty opened docs this will result in a reload at the same position.
                // Not nice, but working.
                const wsEdit = new vscode.WorkspaceEdit();
                const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
                for(const loc of locations) {
                    // Check if doc is not open  
                    let foundDoc = undefined;
                    for(const doc of docs) {
                        if(doc.uri.fsPath == loc.uri.fsPath) {
                            foundDoc = doc;
                            break;
                        }
                    }
                    if(foundDoc) {
                        // use workspace edit because file is opened in editor
                        wsEdit.replace(loc.uri, loc.range, newName);
                    }
                    else {
                        // Change file on disk.
                        // Note: this is called more than once. Although this is superfluous it does not harm.
                        this.renameInFile(loc.uri.fsPath, oldName, newName);
                    }
                }
                
                return resolve(wsEdit);
            });
        });
    }


    /**
     * Replaces all occurences of 'regex' in a file on disk with the 'newName'.
     * @param filePath The absolute file path.
     * @param regex The regex to change. Should be global otherwise only the first name is changed.
     * @param newName The new name.
     */
    protected async renameInFile(filePath: string, oldName: string, newName: string) {
        const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        let text = '';
        const regex = new RegExp('\\b' + oldName + '\\b', 'gm');

        // Read an exchange
        await read(readStream, data => {
            text += data;
        });
        readStream.destroy();
        const replacedText = text.replace(regex, newName);

        // Now write file
        const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
        writeStream.write(replacedText, () => {
            writeStream.close();
        })
    }

}
