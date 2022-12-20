import { CommonRegexes } from '../src/regexes/commonregexes';
import { DefinitionRegexes } from '../src/regexes/definitionregexes';
import {CompletionRegexes} from '../src/regexes/completionregexes';
import * as fs from 'fs';
import {RenameRegexes} from '../src/regexes/renameregexes';
import {CommandsRegexes} from '../src/regexes/commandsregexes';


// For access to protected functions.
const CompletionRegexesMock = CompletionRegexes as any;


/**
 * For reference.
 * A test without FastRegex implementation.
 *
regexLabelColon:  56.25% speed
regexLabelWithoutColon:  100% speed
regexLabelEquOrMacro:  4.545454545454546% speed
regexInclude:  102.7027027027027% speed
regexModuleStruct:  8.695652173913043% speed
regexEndModuleStruct:  6.8181818181818175% speed
regexLabelColonForWord:  17.142857142857142% speed
regexLabelWithoutColonForWord:  100% speed
regexModuleForWord:  10.526315789473683% speed
regexMacroForWord:  10% speed
regexStructForWord:  7.142857142857142% speed
regexAnyReferenceForWord:  105.88235294117648% speed
regexAnyReferenceForWordGlobal:  111.42857142857143% speed
regexEveryLabelColonForWord:  15% speed
regexEveryLabelWithoutColonForWord:  100% speed
regexEveryModuleForWord:  8.108108108108109% speed
regexEveryMacroForWord:  7.5% speed
 */

/**
 * These here are the reference regexes from the 2.9.1 version.
 * The regex performance is measured against those functions.
 */
class RefRegexes {
    public static regexLabelColon(): RegExp {
        return /(^\s*@?)\b([a-z_][\w\.]*):/i;
    }
    public static regexLabelWithoutColon(): RegExp {
        return /^(@?)([a-z_][\w\.]*)(?:\s|$)/i;
    }
    public static regexLabelEquOrMacro(): RegExp {
        return /^[\w\.]+:?\s*\b(equ|macro)/i;
    }
    public static regexInclude(): RegExp {
        return /\s*INCLUDE\s+"(.*)"/i;
    }
    public static regexModuleStruct(): RegExp {
        return /^\s+(MODULE|STRUCT)\s+([\w\.]+)/i;
    }
    public static regexEndModuleStruct(): RegExp {
        return /^\s+(ENDMODULE|ENDS)\b/i;
    }
    public static regexLabelColonForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s*)([^0-9\\s][\\w\\.]*)?\\b' + searchWord + ':');
    }
    public static regexLabelWithoutColonForWord(searchWord: string): RegExp {
        return new RegExp('^()([^0-9\\s][\\w\\.]*)?\\b' + searchWord + '\\b(?![:\\.])');
    }
    public static regexModuleForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
    }
    public static regexMacroForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s+(macro|MACRO)\\s+)' + searchWord + '\\b');
    }
    public static regexStructForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
    }
    public static regexAnyReferenceForWord(searchWord: string): RegExp {
        return new RegExp('^(.*)\\b' + searchWord + '\\b');
    }
    public static regexAnyReferenceForWordGlobal(searchWord: string): RegExp {
        return new RegExp('(.*?)\\b' + searchWord + '\\b', 'g');
    }
    public static regexEveryLabelColonForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s*[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
    }
    public static regexEveryLabelWithoutColonForWord(searchWord: string): RegExp {
        return new RegExp('^(([^0-9 ][\\w\\.]*)?)\\b' + searchWord + '[\\w\\.]*\\b(?![:\\w\\.])', 'i');
    }
    public static regexEveryModuleForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s+(MODULE)\\s+)' + searchWord + '[\\w\\.]*', 'i');
    }
    public static regexEveryMacroForWord(searchWord: string): RegExp {
        return new RegExp('^(\\s+(MACRO)\\s+)' + searchWord + '[\\w\\.]*', 'i');
    }
}


// The base count. I.e. number of times function calls are repeated.
const BASE_COUNT = 100;


suite('Performance', () => {

    let asmLines: string[];
    let listLines: string[];

    setup(() => {
        const asmString = fs.readFileSync('./tests/data/sample.asm').toString();
        asmLines = asmString.split('\n');
        const listString = fs.readFileSync('./tests/data/sample.list').toString();
        listLines = listString.split('\n');
    });


    /**
     * Returns the number of ms it takes to call the function a number of times.
     * @param regex The regex to call.
     * @param compareAsm If true, compares the asm file.
     * @param compareList If true, compares the list file.
     * @param count The number of times to call func.
     * @returns The duration in ms.
     */
    function measure(regex: RegExp, compareAsm: boolean, compareList: boolean, count = BASE_COUNT): number {
        {
            //console.time();
            //const prevTime = Date.now();
            const prevTime: bigint = process.hrtime.bigint();

            if (compareAsm && compareList) {
                for (let i = count; i > 0; i--) {
                    // asm file
                    for (const line of asmLines)
                        regex.exec(line);
                    // list file
                    for (const line of listLines)
                        regex.exec(line);
                }
            }
            else if (compareAsm) {
                for (let i = count; i > 0; i--) {
                    // asm file
                    for (const line of asmLines)
                        regex.exec(line);
                }
            }
            else if (compareList) {
                for (let i = count; i > 0; i--) {
                    // list file
                    for (const line of listLines)
                        regex.exec(line);
                }
            }

            //const afterTime = Date.now();
            const afterTime: bigint = process.hrtime.bigint();
            //console.timeEnd();
            //return afterTime - prevTime;
            const diff = afterTime - prevTime;
            const ms = Number(diff).valueOf() / 1000000;
            //console.log(ms);
            return ms;
        }
    }


    /**
    * Compares execution times of 2 functions.
    * @param regex The regex to call.
    * @param refRegex The reference regex to call. regex is compared with refFunc
    * @param compareAsm If true, compares the asm file.
    * @param compareList If true, compares the list file.
    * @param count The number of times to call func.
    * @returns The relation ship refRegex_time/regex_time*100 in percent.
    */
    function compare(regex: RegExp, refRegex: RegExp, compareAsm: boolean, compareList: boolean, count = BASE_COUNT): number {

        // Call reference regex
        const measuresCount = 5;   // Do 5 samples.
        let refRegexTime = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < measuresCount; i++) {
            const time = measure(refRegex, compareAsm, compareList, count);
            // Choose best time
            if (time < refRegexTime)
                refRegexTime = time;
        }

        // Call regex
        let regexTime = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < measuresCount; i++) {
            const time = measure(regex, compareAsm, compareList, count);
            // Choose best time
            if (time < regexTime)
                regexTime = time;
        }
        const rel = refRegexTime / regexTime;
        return rel*100;
    }


    suite('regexes', () => {

        test('regexLabelColon asm', () => {
            const speed = compare(CommonRegexes.regexLabelColon("asm-collection"), RefRegexes.regexLabelColon(), true, false, BASE_COUNT);
            console.log('regexLabelColon asm: ', speed + '% speed');
        });

        test('regexLabelColon list', () => {
            const speed = compare(CommonRegexes.regexLabelColon("asm-list-file"), RefRegexes.regexLabelColon(), false, true, BASE_COUNT);
            console.log('regexLabelColon list: ', speed + '% speed');
        });

        test('regexLabelWithoutColon', () => {
            const speed = compare(CommonRegexes.regexLabelWithoutColon(), RefRegexes.regexLabelWithoutColon(), true, false, BASE_COUNT);
            console.log('regexLabelWithoutColon: ', speed + '% speed');
        });

        test('regexLabelEquOrMacro', () => {
            const speed = compare(CommandsRegexes.regexLabelEquOrMacro(), RefRegexes.regexLabelEquOrMacro(), true, true, BASE_COUNT);
            console.log('regexLabelEquOrMacro: ', speed + '% speed');
        });

        test('regexInclude', () => {
            const speed = compare(CommonRegexes.regexInclude(), RefRegexes.regexInclude(), true, true, BASE_COUNT);
            console.log('regexInclude: ', speed + '% speed');
        });

        test('regexModuleStruct', () => {
            const speed = compare(CommonRegexes.regexModuleStruct(), RefRegexes.regexModuleStruct(), true, true, BASE_COUNT);
            console.log('regexModuleStruct: ', speed + '% speed');
        });

        test('regexEndModuleStruct', () => {
            const speed = compare(CommonRegexes.regexEndModuleStruct(), RefRegexes.regexEndModuleStruct(), true, true, BASE_COUNT);
            console.log('regexEndModuleStruct: ', speed + '% speed');
        });


        test('regexLabelColonForWord asm', () => {
            const speed = compare(CommonRegexes.regexLabelColonForWord('pause', 'asm-collection'), RefRegexes.regexLabelColonForWord('pause'), true, false, BASE_COUNT);
            console.log('regexLabelColonForWord asm: ', speed + '% speed');
        });

        test('regexLabelColonForWord list', () => {
            const speed = compare(CommonRegexes.regexLabelColonForWord('pause', 'asm-list-file'), RefRegexes.regexLabelColonForWord('pause'), true, false, BASE_COUNT);
            console.log('regexLabelColonForWord list: ', speed + '% speed');
        });

        test('regexLabelWithoutColonForWord', () => {
            const speed = compare(CommonRegexes.regexLabelWithoutColonForWord('pause'), RefRegexes.regexLabelWithoutColonForWord('pause'), true, true, BASE_COUNT);
            console.log('regexLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexModuleForWord', () => {
            const speed = compare(CommonRegexes.regexModuleForWord('pause'), RefRegexes.regexModuleForWord('pause'), true, true, BASE_COUNT);
            console.log('regexModuleForWord: ', speed + '% speed');
        });

        test('regexMacroForWord', () => {
            const speed = compare(CommonRegexes.regexMacroForWord('pause'), RefRegexes.regexMacroForWord('pause'), true, true, BASE_COUNT);
            console.log('regexMacroForWord: ', speed + '% speed');
        });

        test('regexStructForWord', () => {
            const speed = compare(DefinitionRegexes.regexStructForWord('pause'), RefRegexes.regexStructForWord('pause'), true, true, BASE_COUNT);
            console.log('regexStructForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWord short word', () => {
            const speed = compare(CommonRegexes.regexAnyReferenceForWord('a'), RefRegexes.regexAnyReferenceForWord('a'), true, true, BASE_COUNT);
            console.log('regexAnyReferenceForWord short word: ', speed + '% speed');
        });

        test('regexAnyReferenceForWord', () => {
            const speed = compare(CommonRegexes.regexAnyReferenceForWord('pause'), RefRegexes.regexAnyReferenceForWord('pause'), true, true, BASE_COUNT);
            console.log('regexAnyReferenceForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWordGlobal short word', () => {
            const speed = compare(RenameRegexes.regexAnyReferenceForWordGlobal('a'), RefRegexes.regexAnyReferenceForWordGlobal('a'), true, true, BASE_COUNT/10);
            console.log('regexAnyReferenceForWordGlobal short word: ', speed + '% speed');
        });

        test('regexAnyReferenceForWordGlobal', () => {
            const speed = compare(RenameRegexes.regexAnyReferenceForWordGlobal('pause'), RefRegexes.regexAnyReferenceForWordGlobal('pause'), true, true, BASE_COUNT/10);
            console.log('regexAnyReferenceForWordGlobal: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord short word asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('a'), RefRegexes.regexEveryLabelWithoutColonForWord('a'), true, false, BASE_COUNT);
            console.log('regexEveryLabelColonForWord short word asm: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('pause'), RefRegexes.regexEveryLabelWithoutColonForWord('pause'), true, false, BASE_COUNT);
            console.log('regexEveryLabelColonForWord asm: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord short word list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('a'), RefRegexes.regexEveryLabelWithoutColonForWord('a'), false, true, BASE_COUNT);
            console.log('regexEveryLabelColonForWord short word list: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('pause'), RefRegexes.regexEveryLabelWithoutColonForWord('pause'), false, true, BASE_COUNT);
            console.log('regexEveryLabelColonForWord list: ', speed + '% speed');
        });

        test('regexEveryLabelWithoutColonForWord short word', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('a'), RefRegexes.regexEveryLabelWithoutColonForWord('a'), true, true, BASE_COUNT);
            console.log('regexEveryLabelWithoutColonForWord short word: ', speed + '% speed');
        });

        test('regexEveryLabelWithoutColonForWord', () => {
            const speed = compare(CompletionRegexesMock.regexEveryLabelWithoutColonForWord('pause'), RefRegexes.regexEveryLabelWithoutColonForWord('pause'), true, true, BASE_COUNT);
            console.log('regexEveryLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexEveryModuleForWord short word asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryModuleForWord('a'), RefRegexes.regexEveryModuleForWord('a'), true, false, BASE_COUNT);
            console.log('regexEveryModuleForWord short word asm: ', speed + '% speed');
        });

        test('regexEveryModuleForWord asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryModuleForWord('TestSuite_Fill'), RefRegexes.regexEveryModuleForWord('TestSuite_Fill'), true, false, BASE_COUNT);
            console.log('regexEveryModuleForWord asm: ', speed + '% speed');
        });

        test('regexEveryModuleForWord short word list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryModuleForWord('a'), RefRegexes.regexEveryModuleForWord('a'), false, true, BASE_COUNT);
            console.log('regexEveryModuleForWord short word list: ', speed + '% speed');
        });

        test('regexEveryModuleForWord list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryModuleForWord('TestSuite_Fill'), RefRegexes.regexEveryModuleForWord('TestSuite_Fill'), false, true, BASE_COUNT);
            console.log('regexEveryModuleForWord list: ', speed + '% speed');
        });

        test('regexEveryMacroForWord short word asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryMacroForWord('a'), RefRegexes.regexEveryMacroForWord('a'), true, false, BASE_COUNT);
            console.log('regexEveryMacroForWord short word asm: ', speed + '% speed');
        });

        test('regexEveryMacroForWord asm', () => {
            const speed = compare(CompletionRegexesMock.regexEveryMacroForWord('WAIT_SPACE'), RefRegexes.regexEveryMacroForWord('WAIT_SPACE'), true, false, BASE_COUNT);
            console.log('regexEveryMacroForWord asm: ', speed + '% speed');
        });

        test('regexEveryMacroForWord short word list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryMacroForWord('a'), RefRegexes.regexEveryMacroForWord('a'), false, true, BASE_COUNT);
            console.log('regexEveryMacroForWord short word list: ', speed + '% speed');
        });

        test('regexEveryMacroForWord list', () => {
            const speed = compare(CompletionRegexesMock.regexEveryMacroForWord('WAIT_SPACE'), RefRegexes.regexEveryMacroForWord('WAIT_SPACE'), false, true, BASE_COUNT);
            console.log('regexEveryMacroForWord list: ', speed + '% speed');
        });
    });
});
