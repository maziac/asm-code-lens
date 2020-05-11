import * as vscode from 'vscode';
import { grep, reduceLocations, getTextDocument } from './grep';
import * as fs from 'fs';
import { regexInclude, regexAnyReferenceForWordGlobal } from './regexes';



/**
 * RenameProvider for assembly language.
 * User selects "Rename symbol".
 */
export class RenameProvider implements vscode.RenameProvider {
    /**
     * Called from vscode if the user selects "Rename symbol".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options 
     * @param token 
     */
    public provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Thenable<vscode.WorkspaceEdit> {
        return new Promise<vscode.WorkspaceEdit>((resolve,reject) => {
                return resolve(this.rename(document, position, newName));
        });
    }

    
    /**
     * Searches for oldName in all files and replaces it with newName.
     * @param oldName The name to replace.
     * @param newName The new name.
     */
    public rename(document: vscode.TextDocument, position: vscode.Position, newName: string): Thenable<vscode.WorkspaceEdit> {
        return new Promise<vscode.WorkspaceEdit>((resolve, reject) => {
            const oldName = document.getText(document.getWordRangeAtPosition(position));
            const searchRegex = regexAnyReferenceForWordGlobal(oldName);

            grep(searchRegex)
            .then(locations => {
                reduceLocations(locations, document.fileName, position, false)
                .then(reducedLocations => {
                    // Change to WorkSpaceEdits.
                    // Note: WorkSpaceEdits do work on all (even not opened files) in the workspace.
                    // However the problem is that the file which is not yet open would be
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
                    const fileMap = new Map<string, Array<vscode.Range>>()
                    for(const loc of reducedLocations) {
                        // Check if doc is not open  
                        const fsPath = loc.uri.fsPath;
                        const foundDoc = getTextDocument(fsPath, docs);
                        if(foundDoc) {
                            // use workspace edit because file is opened in editor
                            wsEdit.replace(loc.uri, loc.range, newName);
                        }
                        else {
                            // Remember the change for the files on disk:
                            // It may happen that the same file is changed several times.
                            // Therefore the data is collected first.
                            // Check if location array already exists.
                            let locs = fileMap.get(fsPath);
                            if(!locs) {
                                // If not, create it.
                                locs = new Array<any>();
                                fileMap.set(fsPath, locs);
                            }
                            // Add location
                            locs.push(loc.range);
                        }
                    }
                    
                    // Change files on disk.
                    for(const [fsPath, changes] of fileMap) {
                        this.renameInFile(fsPath, changes, newName);
                    }

                    return resolve(wsEdit);
                });
            });
        });
    }


    /**
     * Replaces one occurence in the file on disk with the 'newName'.
     * @param filePath The absolute file path.
     * @param changes The changes: an array with locations.
     * @param newName The new name.
     */
    protected async renameInFile(filePath: string, changes: Array<vscode.Range>, newName: string) {
        const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

        // Read and exchange
        const linesData = fs.readFileSync(filePath, {encoding: 'utf-8'});
        const lines = linesData.split('\n');

        // Process all changes
        const regex = regexInclude();
        for(const range of changes) {
            const row = range.start.line;
            const clmn = range.start.character;
            const clmnEnd = range.end.character;
            const line = lines[row];
            
            // Skip include lines
            const match = regex.exec(line);
            if(match)
                continue;

            // Replace
            const replacedLine = line.substr(0, clmn) + newName + line.substr(clmnEnd);
            lines[row] = replacedLine;
        }

        // Now write file
        const replacedText = lines.join('\n');
        const writeStream = fs.createWriteStream(filePath, { encoding: 'utf-8' });
        await writeStream.write(replacedText, () => {
            writeStream.close();
        })
    }

}
