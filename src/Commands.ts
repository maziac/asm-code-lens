'use strict';
import * as vscode from 'vscode';
import * as assert from 'assert';
import { grep, grepTextDocument, FileMatch, grepMultiple, reduceLocations } from './grep';
import { regexLabelColon, regexLabelWithoutColon } from './regexes';
import { Location } from 'vscode';
import { CodeLensProvider } from './CodeLensProvider';

var grepit = require('grepit');


/// Output to the vscode "OUTPUT" tab.
let output = vscode.window.createOutputChannel("ASM Code Lens");


/**
 * Static user command functions.
 * - findLabelsWithNoReference: Searches all labels and shows the ones that are not referenced.
 */
export class Commands { 

    /**
     * Searches all labels and shows the ones that are not referenced.
     */
    public static findLabelsWithNoReference() {
        grepMultiple([regexLabelColon(), regexLabelWithoutColon()])
        .then(locations => {
            //dbgPrintLocations(locations);
            // locations is a GrepLocation array that contains all found labels.
            // Convert this to an array of labels.
            this.findLabels(locations);
        });
    }



    /**
     * Finds all labels without reference.
     * I.e. prints out all labels in 'locLabels' which are note referenced somewhere.
     * @param locLabels A list of GrepLocations.
     */
    protected static async findLabels(locLabels) {
        output.appendLine("Unreferenced labels:");
        output.show(true);
    
        await vscode.workspace.findFiles('**/*.{asm,inc,s,a80}', null)
        .then(async uris => {
            try {
                const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
                uris.unshift(undefined);

                let labelsCount = locLabels.length;
                let unrefLabels = 0;
                const regexEqu = /[\s:]\s*(equ|macro)/i;
                for(const locLabel of locLabels) {
                    // Skip all EQU and MACRO
                    const fm: FileMatch = locLabel.fileMatch;
                    regexEqu.lastIndex = fm.match[1].length;
                    const matchEqu = regexEqu.exec(fm.lineContents);
                    if(matchEqu)
                        continue;

                    // Get label
                    const label = fm.match[1];
                    const searchLabel = label.replace(/\./, '\\.');
                    const pos = new vscode.Position(fm.line, fm.start);
                    const fileName = fm.filePath;

                    // And search for references
                    const regex = new RegExp('^([^;"]*)\\b' + searchLabel + '\\b');
                    grep(regex)
                    .then(locations => {
                        // Remove any locations because of module information (dot notation)
                        reduceLocations(locations, fileName, pos)
                        .then(reducedLocations => {
                            // Check count
                            const count = reducedLocations.length;
                            if(count == 0) {
                                // No reference
                                unrefLabels ++;
                                output.appendLine(label + ", " + fileName + ":" + (pos.line+1));
                            }
                            // Check for last search
                        labelsCount --;
                            if(labelsCount == 0)
                                output.appendLine("Done. " + unrefLabels + ' unreferenced label' + ((unrefLabels > 1) ? 's':'') + ".");
                        });
                    });
                }
            }
            catch(e) {
                console.log("Error: ", e);
            }
        });   
        
        // Check if any label is unreferenced
        if(locLabels.length == 0) 
            output.appendLine("None.");
    }

}

