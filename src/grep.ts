import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as PQueue from 'p-queue';
import * as fastGlob from 'fast-glob';


/**
 * Reads data from a stream.
 * @param stream 
 * @param onData 
 */
export function read(stream, onData) {
    return new Promise((resolve, reject) => {
        const promises = [];
        stream.on('data', data => promises.push(onData(data)));
        stream.on('error', reject);
        stream.on('end', () => Promise.all(promises).then(resolve));
    });
}


/**
 * Searches files according to opts.
 * opts includes the directory the glob pattern and the regular expression (the word) to
 * search for.
 * @param opts opts.cwd = directory, 
 * opts.globs = the glob pattern, if undefined uses asse,bler defaults,
 * opts.regex = the regular expression to search for, 
 * opts.singleResult = true/false, if true only a single result is 
 * returned (faster).
 * @returns An array of the vscode locations of the found expressions.
 */
export async function grep(opts): Promise<Array<vscode.Location>> {
    const cwd = opts.cwd;
    const globs = opts.globs || ['**/*.{asm,inc,s,a80}'];
    const regex = opts.regex;
    const singleResult = opts.singleResult;
    
    const readQueue = new PQueue();
    const fileStream = fastGlob.stream(globs, {cwd: cwd} );
    const allMatches = new Map();
    let leave = false;
    
    await read(fileStream, async fileName => {
        if(leave)
            return;
        
        await readQueue.add(async () => {
            if(leave)
                return;
        
            const filePath = path.join(cwd, fileName);
            const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
            let fileMatches = allMatches.get(fileName);
            let lastIndex = 0;
    
            await read(readStream, data => {
                if(leave)
                   return;

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
                        allMatches.set(fileName, fileMatches);
                    }
        
                    fileMatches.push({
                        filePath,
                        line,
                        start,
                        end,
                        lineContents
                    });

                    // Check if only one result is wanted
                    if(singleResult) {
                        leave = true;
                        break;
                    }
                }
    
                lastIndex += len;
            });
        });
    });

    // Convert matches to vscode locations
    const locations: Array<vscode.Location> = [];
    for(const [file,matches] of allMatches) {
        // Iterate all matches inside file
        for(const match of matches) {
            const lineNr = match.line;
            const colStart = match.start;
            const colEnd = match.end;
            const startPos = new vscode.Position(lineNr, colStart);
            const endPos = new vscode.Position(lineNr, colEnd);
            const loc = new vscode.Location(vscode.Uri.file(path.join(cwd, file)), new vscode.Range(startPos, endPos));
            // store
            locations.push(loc);                       
        }
    }
 
    return locations;
}




/**
 * Searches a vscode.TextDocument for a regular expression and
 * returns the found line numbers.
 * @param doc The TextDocument.
 * @returns An array that contains: line number, start column, end column, and the text of the line.
 */
export function grepTextDocument(doc: vscode.TextDocument, regex: RegExp): Array<any> {
    const matches = new Array<any>();
    const len = doc.lineCount;
    for (let line=0; line<len; line++) {
        const textLine = doc.lineAt(line);
        const lineContents = textLine.text;
        const match = regex.exec(lineContents);
        if(!match) 
            continue;

        // Found: get start and end
        const start = match.index;
        const end = match.index + match[0].length;

        // Store found result
        matches.push({
            line,  // line number (starts at 0)
            start,  // start column
            end,    // end column
            lineContents
        });
    }
    return matches;
}