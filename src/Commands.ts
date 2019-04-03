'use strict';
import * as vscode from 'vscode';
import * as assert from 'assert';
import { grep, grepTextDocument, FileMatch } from './grep';
import { Location } from 'vscode';

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
        // Label regex:
        const lblRegex = new RegExp('^[ \t]*\\b([a-z_][\\w\.]*):\s*(equ|macro)?', 'i');
        grep(lblRegex)
        .then(labelLocations => {
            // locations is a GrepLocation array that contains all found labels.
            // Convert this to an array of labels.
            this.findLabels(labelLocations);
        });
    }



    /**
     * Searches files according to opts.
     * opts includes the directory the glob pattern and the regular expression (the word) to
     * search for.
     * @param opts opts.regex = the regular expression to search for, 
     * opts.singleResult = true/false, if true only a single result is 
     * returned (faster).
     */
    protected static async findLabels(locLabels) {
        output.appendLine("Unreferenced labels:");
        output.show(true);
        let count = 0;

        await vscode.workspace.findFiles('**/*.{asm,inc,s,a80}', null)
        .then(async uris => {
            try {
                const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
                uris.unshift(undefined);

                for(const locLabel of locLabels) {
                    // Skip all equ
                    const equ = locLabel.fileMatch.match[2];
                    if(equ)
                        continue;

                    const label = locLabel.fileMatch.match[1];





                    
                    let leave = false;
                    const regex = new RegExp('^[^;]*\\b' + label + '(?![\\w:])');
                    const firstFileName = locLabel.fileMatch.filePath;
                    const firstUri = vscode.Uri.file(firstFileName);
                    uris[0] = firstUri;

                    for(const uri of uris) {
                        // get fileName
                        const fileName = uri.fsPath;
                        const filePath = fileName;

                        // Check if file is opened in editor
                        let foundDoc = undefined;
                        for(const doc of docs) {
                            if(doc.isDirty) {   // Only check dirty documents, other are on disk
                                if(doc.fileName == filePath) {
                                    foundDoc = doc;
                                    break;
                                }
                            }
                        }

                        // Check if file on disk is checked or in vscode
                        if(foundDoc) {
                            // Check file in vscode
                            const fileMatches = grepTextDocument(foundDoc, regex);
                            if(fileMatches.length > 0) {
                                leave = true;
                                count ++;
                            }
                        }
                        else {
                            // Check file on disk
                            const result = grepit(regex, filePath);
                            if(result.length > 0) {
                                leave = true;
                                count ++;
                            }
                        }
                        if(leave)
                            break;
                    }
                    // Check if found
                    if(!leave) {
                        // Not found
                        output.appendLine(label + ", " + firstFileName + ":" + (locLabel.fileMatch.line+1));
    
                    }
                }
            }
            catch(e) {
                console.log("Error: ", e);
            }
        });   
        
        // Check if any label is unreferenced
        if(count == 0) 
            output.appendLine("None.");
    }

}

