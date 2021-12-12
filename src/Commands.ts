import * as vscode from 'vscode';
import * as path from 'path';
import { grep, FileMatch, grepMultiple, reduceLocations  } from './grep';
import { regexLabelEquOrMacro, regexAnyReferenceForWord, regexesLabel } from './regexes';
import {Config} from './config';


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
    public static async findLabelsWithNoReference(config: Config): Promise<void> {
        // Get regexes
        const regexes = regexesLabel(config);
        // Get all label definition (locations)
        const labelLocations = await grepMultiple(regexes, config.rootFolder);

        //dbgPrintLocations(locations);
        // locations is a GrepLocation array that contains all found labels.
        // Convert this to an array of labels.
        this.findLabels(labelLocations, config.rootFolder);
    }



    /**
     * Finds all labels without reference.
     * I.e. prints out all labels in 'locLabels' which are note referenced somewhere.
     * @param locLabels A list of GrepLocations.
     * @param rootFolder The search is limited to the root / project folder. This needs to contain a trailing '/'.
     */
    protected static async findLabels(locLabels, rootFolder: string): Promise<void> {
        const baseName = path.basename(rootFolder);
        output.appendLine("Unreferenced labels, " + baseName + ":");
        output.show(true);

        try {
            let labelsCount = locLabels.length;
            let unrefLabels = 0;
            const regexEqu = regexLabelEquOrMacro();
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
                const regex = regexAnyReferenceForWord(searchLabel);
                const locations = await grep(regex, rootFolder);
                // Remove any locations because of module information (dot notation)
                const reducedLocations = await reduceLocations(locations, fileName, pos);
                // Check count
                const count = reducedLocations.length;
                if (count == 0) {
                    // No reference
                    unrefLabels++;
                    output.appendLine(label + ", file://" + fileName + "#" + (pos.line + 1));
                }
                // Check for last search
                labelsCount--;
                // output.appendLine("labelCount="+labelsCount);
                if (labelsCount == 0)
                    output.appendLine("Done. " + unrefLabels + ' unreferenced label' + ((unrefLabels > 1) ? 's' : '') + ".");
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

