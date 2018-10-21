import * as vscode from 'vscode';
import * as fs from 'fs';
//import * as path from 'path';
import * as PQueue from 'p-queue';
//import * as fastGlob from 'fast-glob';


export interface FileMatch {
    /// The file path of the match:
    filePath: string,
    /// The line number:
    line: number,
    /// The column:
    start: number,
    /// The end column:
    end: number,
    /// The contents of the found line:
    lineContents: string,
    /// The corresponding match object.
    match: RegExpExecArray
}

/**
 * This extends the vscode location object by 
 * the match object.
 * Used in 'findLabelsWithNoReference'.
 */
export class GrepLocation extends vscode.Location {
    public fileMatch: FileMatch;

    /**
     * Creates a new location object.
     * @param uri The resource identifier.
     * @param rangeOrPosition The range or position. Positions will be converted to an empty range.
     * @param fileMatch The complete file match object.
     */
    constructor(uri: vscode.Uri, rangeOrPosition: vscode.Range | vscode.Position, fileMatch: FileMatch) {
        super(uri, rangeOrPosition);
        this.fileMatch = fileMatch;
    }
}

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
 * @param opts opts.regex = the regular expression to search for, 
 * opts.singleResult = true/false, if true only a single result is 
 * returned (faster).
 * @returns An array of the vscode locations of the found expressions.
 */
export async function grep(opts): Promise<Array<GrepLocation>> {
    //const cwd = opts.cwd;
    //const globs = opts.globs || ['**/*.{asm,inc,s,a80}'];
    const regex = opts.regex;
    const singleResult = opts.singleResult;
    
    const readQueue = new PQueue();
    //const fileStream = fastGlob.stream(globs, {cwd: cwd} );
    const allMatches = new Map();
    let leave = false;
    
    await vscode.workspace.findFiles('**/*.{asm,inc,s,a80}', null)
    .then(async uris => {
        const docs = vscode.workspace.textDocuments.filter(doc => doc.isDirty);
 
        for(const uri of uris) {
        
            if(leave)
                return;

            // get fileName
            const fileName = uri.fsPath;
        
            await readQueue.add(async () => {
                if(leave)
                    return;
            
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
                    // Add filename to matches
                    for(const match of fileMatches) {
                        match.filePath = fileName;
                    }
                    // Store
                    allMatches.set(fileName, fileMatches);
                }
                else {
                    // Check file on disk
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
                                lineContents,
                                match
                            });

                            // Check if only one result is wanted
                            if(singleResult) {
                                leave = true;
                                return;
                            }
                        }
            
                        lastIndex += len;
                    });
                }
                if(leave)
                    return;
            });
        }
    });

    // Convert matches to vscode locations
    const locations: Array<GrepLocation> = [];
    for(const [file,matches] of allMatches) {
        // Iterate all matches inside file
        for(const match of matches) {
            const lineNr = match.line;
            const colStart = match.start;
            const colEnd = match.end;
            const startPos = new vscode.Position(lineNr, colStart);
            const endPos = new vscode.Position(lineNr, colEnd);
            const loc = new GrepLocation(vscode.Uri.file(file), new vscode.Range(startPos, endPos), match);
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
export function grepTextDocument(doc: vscode.TextDocument, regex: RegExp): Array<FileMatch> {
    const matches = new Array<FileMatch>();
    const len = doc.lineCount;
    for (let line=0; line<len; line++) {
        const textLine = doc.lineAt(line);
        const lineContents = textLine.text;

        let match = regex.exec(lineContents);
        while(match !== null) {
             // Found: get start and end
            const start = match.index;
            const end = match.index + match[0].length;

            // Store found result
            matches.push({
                filePath: undefined,
                line,  // line number (starts at 0)
                start,  // start column
                end,    // end column
                lineContents,
                match
            });

            // Note if "g" was specified multiple matches (e.g. for rename) can be found.
            if(regex.global)
               match = regex.exec(lineContents)
            else 
                match = null;
        }
    }
    return matches;
}


