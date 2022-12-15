import {Config} from './config';
import {AllowedLanguageIds} from './languageId';
import {CommonRegexes} from './regexes/commonregexes';
import * as vscode from 'vscode';
import {grep, openTextDocument, reduceLocations} from './grep';
import * as fs from 'fs';
import {RenameRegexes} from './regexes/renameregexes';



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
    public async provideRenameEdits(document: vscode.TextDocument, position: vscode.Position, newName: string, token: vscode.CancellationToken): Promise<vscode.WorkspaceEdit|undefined> {
        // Check which workspace
        const config = Config.getConfigForDoc(document);
        if (!config) {
            vscode.window.showWarningMessage("Document is in no workspace folder.");
            return new vscode.WorkspaceEdit();  // Empty = no change
        }
        if (!config.enableRenaming) {
            vscode.window.showWarningMessage("Renaming is disabled for this workspace folder.");
            return new vscode.WorkspaceEdit();  // Empty = no change
        }

        // Rename
        const oldName = document.getText(document.getWordRangeAtPosition(position));
        const searchRegex = RenameRegexes.regexAnyReferenceForWordGlobal(oldName);

        const languageId = document.languageId as AllowedLanguageIds;
        const locations = await grep(searchRegex, config.wsFolderPath, languageId, config.excludeFiles);
        const regexLbls = CommonRegexes.regexesLabel(config, languageId);
        const reducedLocations = await reduceLocations(regexLbls, locations, document.fileName, position, false, true, /\w/);

        // Change to WorkSpaceEdits.
        // Note: WorkSpaceEdits do work on all (even not opened files) in the workspace.
        // If a file is not open in the text editor it will remain unopened.
        // (This was probably different in the past.)
        // I.e. WorkSpaceEdits can work on all files:
        // - not opened in text editor
        // - opened in text editor and saved
        // - opened in text editor and unsaved. The file in the editor will be saved, but this is normal behavior also e.g. in typescript renaming.
        const wsEdit = new vscode.WorkspaceEdit();
        for (const loc of reducedLocations) {
            wsEdit.replace(loc.uri, loc.range, newName);
        }

        return wsEdit;
    }


    /**
     * Replaces one occurrence in the file on disk with the 'newName'.
     * @param filePath The absolute file path.
     * @param changes The changes: an array with locations.
     * @param newName The new name.
     */
    protected async renameInFile(filePath: string, changes: Array<vscode.Range>, newName: string) {
        //const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

        // Read and exchange
        const linesData = fs.readFileSync(filePath, {encoding: 'utf-8'});
        const lines = linesData.split('\n');

        // Process all changes
        const regex = CommonRegexes.regexInclude();
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
            const replacedLine = line.substring(0, clmn) + newName + line.substring(clmnEnd);
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
