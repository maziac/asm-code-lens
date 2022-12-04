import { AllowedLanguageIds } from './languageId';
import { CommonRegexes } from './regexes/commonregexes';
import * as path from 'path';
import * as vscode from 'vscode';
import {Config} from './config';
import {FileMatch, grep, grepMultiple, reduceLocations} from './grep';
import {CommandsRegexes} from './regexes/commandsregexes';
import * as os from 'node:os';


/// Output to the vscode "OUTPUT" tab.
let output = vscode.window.createOutputChannel("ASM Code Lens");


/**
 * Static user command functions.
 * - findLabelsWithNoReference: Searches all labels and shows the ones that are not referenced.
 */
export class Commands {

    /**
     * Searches all labels and shows the ones that are not referenced.
     * @param config The configuration (preferences) to use.
     * (config.rootFolder The search is limited to the root / project
     * folder. This needs to contain a trailing '/'.)
     */
    public static async findLabelsWithNoReference(config: Config, languageId: AllowedLanguageIds): Promise<void> {
        // Get regexes
        const regexes = CommonRegexes.regexesLabel(config, languageId);
        // Get all label definition (locations)
        const labelLocations = await grepMultiple(regexes, config.wsFolderPath, languageId, config.excludeFiles);

        //dbgPrintLocations(locations);
        // locations is a GrepLocation array that contains all found labels.
        // Convert this to an array of labels.
        this.findLabels(labelLocations, config, languageId);
    }


    /**
     * Finds all labels without reference.
     * I.e. prints out all labels in 'locLabels' which are note referenced somewhere.
     * @param locLabels A list of GrepLocations.
     * @param rootFolder The search is limited to the root / project folder. This needs to contain a trailing '/'.
     */
    protected static async findLabels(locLabels, cfg: Config, languageId: AllowedLanguageIds): Promise<void> {
        const baseName = path.basename(cfg.wsFolderPath);
        const typename = (languageId == 'asm-list-file') ? 'list' : 'asm';
        output.appendLine("Unreferenced labels for " + typename + " files, " + baseName + ":");
        output.show(true);

        try {
            const osName = os.platform();   // e.g. "win32", "darwin", "linux"
            let labelsCount = locLabels.length;
            let unrefLabels = 0;
            const regexEqu = CommandsRegexes.regexLabelEquOrMacro();
            const regexLbls = CommonRegexes.regexesLabel(cfg, languageId);
            for (const locLabel of locLabels) {
                // Skip all EQU and MACRO
                const fm: FileMatch = locLabel.fileMatch;
                regexEqu.lastIndex = fm.match[1].length;
                const matchEqu = regexEqu.exec(fm.lineContents);
                if (matchEqu) {
                    labelsCount--;
                    // output.appendLine("labelCount="+labelsCount);
                    if (labelsCount == 0)
                        output.appendLine("Done. " + unrefLabels + ' unreferenced label' + ((unrefLabels > 1) ? 's' : '') + ".");
                    continue;
                }

                // Get label
                const label = fm.match[2];
                const searchLabel = label.replace(/\./, '\\.');
                const pos = new vscode.Position(fm.line, fm.start);
                const fileName = fm.filePath;

                // And search for references
                const regex = CommonRegexes.regexAnyReferenceForWord(searchLabel);
                const locations = await grep(regex, cfg.wsFolderPath, languageId, cfg.excludeFiles);
                // Remove any locations because of module information (dot notation)
                const reducedLocations = await reduceLocations(regexLbls, locations, fileName, pos, true, true);
                // Check count
                const count = reducedLocations.length;
                if (count == 0) {
                    // No reference
                    unrefLabels++;
                    if(osName === "win32")
                        output.appendLine(label + ", " + fileName + ":" + (pos.line + 1));
                    else
                        output.appendLine(label + ", file://" + fileName + "#" + (pos.line + 1));
                }
                // Check for last search
                labelsCount--;
                // output.appendLine("labelCount="+labelsCount);
                if (labelsCount == 0) {
                    let unrefText = unrefLabels + ' unreferenced label';
                    if (unrefLabels != 1)
                        unrefText += 's';
                    output.appendLine("Done. " + unrefText + ((unrefLabels > 1) ? 's' : '') + ".");
                }
            }
        }
        catch (e) {
            console.log("Error: ", e);
        }

        // Check if any label is unreferenced
        if (locLabels.length == 0)
            output.appendLine("None.");
        output.appendLine('');
    }

}
