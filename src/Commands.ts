'use strict';
import * as vscode from 'vscode';
import * as assert from 'assert';
import { grep, grepTextDocument, FileMatch } from './grep';
import { Location } from 'vscode';

var grepit = require('grepit');

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
        const lblRegex = new RegExp('^[ \t]*\\b([a-zA-Z_]\\w*):');
        grep({ regex: lblRegex })
        .then(labelLocations => {
            // locations is a GrepLocation array that contains all found labels.
            // Convert this to an array of labels.
            //const labels = labelLocations.map(loc => loc.fileMatch.match[1]);
            this.findLabels(labelLocations).then(unreferencedLabels => {
                for(const label of unreferencedLabels) {
                    // No reference
                    console.log("Label=", label);
                }
                
            });

            /*
            for(const labelLoc of labelLocations) {
                const match = labelLoc.fileMatch.match;
                const label = match[1];
                assert(label);

                // Now search for at least one usage of this label
                //const refRegex = new RegExp('^[^;]*\\b' + label + '(?![\\w:])');
                const refRegex = new RegExp('^[^;]*\\b' + label + '');
                grep({ regex: refRegex, singleResult: true })
                .then(refLocations => {
                    if(refLocations.length == 1) {
                        // No reference
                        console.log("Label=", label);
                    }
                });
            }
            */
        });

    }



    /**
     * Searches files according to opts.
     * opts includes the directory the glob pattern and the regular expression (the word) to
     * search for.
     * @param opts opts.regex = the regular expression to search for, 
     * opts.singleResult = true/false, if true only a single result is 
     * returned (faster).
     * @returns An array of the vscode locations of the found expressions.
     */
    protected static async findLabels(locLabels): Promise<Array<string>> {
   //     const readQueue = new PQueue();
        //const fileStream = fastGlob.stream(globs, {cwd: cwd} );
        const allUnref = new Array<string>();
        
        await vscode.workspace.findFiles('**/*.{asm,inc,s,a80}', null)
        .then(async uris => {
            try {
                const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
                uris.unshift(undefined);

                for(const locLabel of locLabels) {
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
                            }
                        }
                        else {
                            // Check file on disk
                            const result = grepit(regex, filePath);
                            if(result.length > 0) {
                                leave = true;
                            }
                        }
                        if(leave)
                            break;
                    }
                    // Check if found
                    if(!leave) {
                        // Not found
                        allUnref.push(label);
                        console.log("fffLabel=", label);
                    }
                }
            }
            catch(e) {
                console.log("Error: ", e);
            }
        });   
        return allUnref;
    }

}
