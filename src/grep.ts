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
 * Searches according to opts.
 * opts includes the directory the glob pattern and the regular expression (the word) to
 * search for.
 * @param opts opts.cwd = directory, opts.globs = the glob pattern,
 * opts.regex = the regular expressionto search for, 
 * opts.singleResult = true/false, if true only a single result is 
 * returned (faster).
 * @returns A Map with filenames and matches.
 */
export async function grep(opts): Promise<Map<string,any>> {
    const cwd = opts.cwd;
    const globs = opts.globs;
    const regex = opts.regex;
    const singleResult = opts.singleResult;
    
    const readQueue = new PQueue();
    const fileStream = fastGlob.stream(globs, {cwd: cwd} );
    const matches = new Map();
    let leave = false;
    
    await read(fileStream, async fileName => {
        if(leave)
            return;
        
        await readQueue.add(async () => {
            if(leave)
                return;
        
            const filePath = path.join(cwd, fileName);
            const readStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
            let fileMatches = matches.get(fileName);
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
                        matches.set(fileName, fileMatches);
                    }
        
                    fileMatches.push({
                        filePath,
                        line,
                        start,
                        end,
                        lineContents,
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
    
    return matches;
}

