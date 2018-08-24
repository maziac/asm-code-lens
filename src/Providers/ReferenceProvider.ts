'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as PQueue from 'p-queue';
import * as fastGlob from 'fast-glob';


/**
 * ReferenceProvider for assembly language.
 */
export class ReferenceProvider implements vscode.ReferenceProvider {
    /**
     * Called from vscode if the used selects "Find all references".
     * @param document The current document.
     * @param position The position of the word for which the references should be found.
     * @param options 
     * @param token 
     */
    public provideReferences(document: vscode.TextDocument, position: vscode.Position,
        options: { includeDeclaration: boolean }, token: vscode.CancellationToken): Thenable<vscode.Location[]> {
           return this.processSearch(document, position);
    }

    
    /**
     * Does a search for a word. I.e. finds all references of the word.
     * @param document The document that contains the word.
     * @param position The word position.
     */
    private processSearch(document, position): Thenable<vscode.Location[]>
    {
        return new Promise<vscode.Location[]>((resolve, reject) => {
            const searchWord = document.getText(document.getWordRangeAtPosition(position));
            const searchRegex = new RegExp('\\b' + searchWord + '\\b');

            const cwd = '/Volumes/Macintosh\ HD\ 2/Projects/zesarux/asm/starwarrior';
            this.grep({
                //cwd: __dirname,
                cwd: cwd,
                globs: ['**/*.{asm,inc,s,a80}'],
                //globs: ['**/*.{asm,list}'],
                //globs: ['**/starwarrior.list'],
                regex: searchRegex,
              }).then(function(filematches) {
                console.log(filematches);
                // Iterate all matches
                const list = [];
                for(const [file,matches] of filematches) {
                    // Iterate all matches inside file
                    for(const match of matches) {
                        const lineNr = match.line;
                        const colStart = match.start;                       
                        const colEnd = match.end;                       
                        const startPos = new vscode.Position(lineNr, colStart);
                        const endPos = new vscode.Position(lineNr, colEnd);
                        const loc = new vscode.Location(vscode.Uri.file(cwd + '/' + file), new vscode.Range(startPos, endPos));
    
                        list.push(loc);                       
                    }
                }
                return resolve(list);
              });
        });
    }


    /**
     * Reads data from a stream.
     * @param stream 
     * @param onData 
     */
    protected read(stream, onData) {
        return new Promise((resolve, reject) => {
          let promises = [];
          stream.on('data', data => promises.push(onData(data)));
          stream.on('error', reject);
          stream.on('end', () => Promise.all(promises).then(resolve));
        });
    }


    /**
     * Searches according to opts.
     * opts includes the directory the glob pattern and the regular expression (the word) to
     * search for.
     * @param opts opts.cwd = directory, opts.globs = the glob pattern, opts.regex = the regular expressionto search for.
     * @returns A Map with filenames and matches.
     */
    protected async grep(opts): Promise<Map<string,any>> {
        let cwd = opts.cwd;
        let globs = opts.globs;
        let regex = opts.regex;
      
        let readQueue = new PQueue();
        let fileStream = fastGlob.stream(globs, {cwd: cwd} );
        let matches = new Map();
      
        await this.read(fileStream, async fileName => {
            await readQueue.add(async () => {
                let filePath = path.join(cwd, fileName);
                let readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                let fileMatches = matches.get(fileName);
                let lastIndex = 0;
        
                await this.read(readStream, data => {
                    const lines = data.split('\n');
                    const len = lines.length;
                    for (let index = 0; index < len; index++) {
                        const lineContents = lines[index];
                        const line = lastIndex + index;
                        const match = regex.exec(lineContents);
                        if(!match) 
                            continue;
                
                        const start = match.index;
                        const end = match.index + match[0].length;
            
                        if (!fileMatches) {
                            fileMatches = [];
                            matches.set(fileName, fileMatches);
                        }
            
                        fileMatches.push({
                            filePath,
                            line,
                            start,
                            end,
                            lineContents,
                        });
                    }
        
                    lastIndex += len;
                });
            });
        });
      
        return matches;
      }

}
