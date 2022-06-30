import { FastRegex } from './../src/fastregex';

import * as fs from 'fs';
import * as re from '../src/regexes';


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
    public static regexEveryLabelColonForWordForCompletion(searchWord: string): RegExp {
        return new RegExp('^(\\s*[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
    }
    public static regexEveryLabelWithoutColonForWordForCompletion(searchWord: string): RegExp {
        return new RegExp('^(([^0-9 ][\\w\\.]*)?)\\b' + searchWord + '[\\w\\.]*\\b(?![:\\w\\.])', 'i');
    }
    public static regexEveryModuleForWordForCompletion(searchWord: string): RegExp {
        return new RegExp('^(\\s+(MODULE)\\s+)' + searchWord + '[\\w\\.]*', 'i');
    }
    public static regexEveryMacroForWordForCompletion(searchWord: string): RegExp {
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
     * @param count The number of times to call func.
     * @returns The duration in ms.
     */
    function measure(regex: RegExp | FastRegex, count = BASE_COUNT): number {
        /*
        if (regex instanceof FastRegex) {
            const prevTime = Date.now();

            for (let i = count; i > 0; i--) {
                // asm file
                for (const line of asmLines)
                    regex.regexes[0].exec(line) || regex.regexes[1].exec(line);
                // list file
                for (const line of listLines)
                    regex.regexes[0].exec(line) || regex.regexes[1].exec(line);
            }

            const afterTime = Date.now();
            return afterTime - prevTime;
        }
        else
        */
        {
            const prevTime = Date.now();

            for (let i = count; i > 0; i--) {
                // asm file
                for (const line of asmLines)
                    regex.exec(line);
                // list file
                for (const line of listLines)
                    regex.exec(line);
            }

            const afterTime = Date.now();
            return afterTime - prevTime;
        }
    }

    /**
    * Compares execution times of 2 functions.
    * @param regex The regex to call.
    * @param refRegex The reference regex to call. regex is compared with refFunc
    * @param count The number of times to call func.
    * @returns The relation ship refRegex_time/regex_time*100 in percent.
    */
    function compare(regex: RegExp | FastRegex, refRegex: RegExp, count = BASE_COUNT): number {
        // Throw away first measure.
        measure(/.*/, count);

        // Call reference regex
        const refRegexTime = measure(refRegex, count);

        // Call regex
        const regexTime = measure(regex, count);

        const rel = refRegexTime / regexTime;
        return rel*100;
    }


    suite('regexes', () => {

        test('regexLabelColon', () => {
            const speed = compare(re.regexLabelColon(), RefRegexes.regexLabelColon(), BASE_COUNT);
            console.log('regexLabelColon: ', speed + '% speed');
        });

        test('regexLabelColonNew', () => {
            const speed = compare(re.regexLabelColonNew(), RefRegexes.regexLabelColon(), BASE_COUNT);
            console.log('regexLabelColonNew: ', speed + '% speed');
        });

        test('regexLabelWithoutColon', () => {
            const speed = compare(re.regexLabelWithoutColon(), RefRegexes.regexLabelWithoutColon(), BASE_COUNT);
            console.log('regexLabelWithoutColon: ', speed + '% speed');
        });

        test('regexLabelEquOrMacro', () => {
            const speed = compare(re.regexLabelEquOrMacro(), RefRegexes.regexLabelEquOrMacro(), BASE_COUNT);
            console.log('regexLabelEquOrMacro: ', speed + '% speed');
        });

        test('regexInclude', () => {
            const speed = compare(re.regexInclude(), RefRegexes.regexInclude(), BASE_COUNT);
            console.log('regexInclude: ', speed + '% speed');
        });

        test('regexModuleStruct', () => {
            const speed = compare(re.regexModuleStruct(), RefRegexes.regexModuleStruct(), BASE_COUNT);
            console.log('regexModuleStruct: ', speed + '% speed');
        });

        test('regexEndModuleStruct', () => {
            const speed = compare(re.regexEndModuleStruct(), RefRegexes.regexEndModuleStruct(), BASE_COUNT);
            console.log('regexEndModuleStruct: ', speed + '% speed');
        });


        test('regexLabelColonForWord', () => {
            const speed = compare(re.regexLabelColonForWord('pause'), RefRegexes.regexLabelColonForWord('pause'), BASE_COUNT);
            console.log('regexLabelColonForWord: ', speed + '% speed');
        });

        test('regexLabelWithoutColonForWord', () => {
            const speed = compare(re.regexLabelWithoutColonForWord('pause'), RefRegexes.regexLabelWithoutColonForWord('pause'), BASE_COUNT);
            console.log('regexLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexModuleForWord', () => {
            const speed = compare(re.regexModuleForWord('pause'), RefRegexes.regexModuleForWord('pause'), BASE_COUNT);
            console.log('regexModuleForWord: ', speed + '% speed');
        });

        test('regexMacroForWord', () => {
            const speed = compare(re.regexMacroForWord('pause'), RefRegexes.regexMacroForWord('pause'), BASE_COUNT);
            console.log('regexMacroForWord: ', speed + '% speed');
        });

        test('regexStructForWord', () => {
            const speed = compare(re.regexStructForWord('pause'), RefRegexes.regexStructForWord('pause'), BASE_COUNT);
            console.log('regexStructForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWord short word', () => {
            const speed = compare(re.regexAnyReferenceForWord('a'), RefRegexes.regexAnyReferenceForWord('a'), BASE_COUNT);
            console.log('regexAnyReferenceForWord short word: ', speed + '% speed');
        });

        test('regexAnyReferenceForWord', () => {
            const speed = compare(re.regexAnyReferenceForWord('pause'), RefRegexes.regexAnyReferenceForWord('pause'), BASE_COUNT);
            console.log('regexAnyReferenceForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWordGlobal short word', () => {
            const speed = compare(re.regexAnyReferenceForWordGlobal('a'), RefRegexes.regexAnyReferenceForWordGlobal('a'), BASE_COUNT);
            console.log('regexAnyReferenceForWordGlobal short word: ', speed + '% speed');
        });

        test('regexAnyReferenceForWordGlobal', () => {
            const speed = compare(re.regexAnyReferenceForWordGlobal('pause'), RefRegexes.regexAnyReferenceForWordGlobal('pause'), BASE_COUNT);
            console.log('regexAnyReferenceForWordGlobal: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord short word', () => {
            const speed = compare(re.regexEveryLabelWithoutColonForWordForCompletion('a'), RefRegexes.regexEveryLabelWithoutColonForWordForCompletion('a'), BASE_COUNT);
            console.log('regexEveryLabelColonForWord short word: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord', () => {
            const speed = compare(re.regexEveryLabelWithoutColonForWordForCompletion('pause'), RefRegexes.regexEveryLabelWithoutColonForWordForCompletion('pause'), BASE_COUNT);
            console.log('regexEveryLabelColonForWord: ', speed + '% speed');
        });

        test('regexEveryLabelWithoutColonForWord short word', () => {
            const speed = compare(re.regexEveryLabelWithoutColonForWordForCompletion('a'), RefRegexes.regexEveryLabelWithoutColonForWordForCompletion('a'), BASE_COUNT);
            console.log('regexEveryLabelWithoutColonForWord short word: ', speed + '% speed');
        });

        test('regexEveryLabelWithoutColonForWord', () => {
            const speed = compare(re.regexEveryLabelWithoutColonForWordForCompletion('pause'), RefRegexes.regexEveryLabelWithoutColonForWordForCompletion('pause'), BASE_COUNT);
            console.log('regexEveryLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexEveryModuleForWord short word', () => {
            const speed = compare(re.regexEveryModuleForWordForCompletion('a'), RefRegexes.regexEveryModuleForWordForCompletion('a'), BASE_COUNT);
            console.log('regexEveryModuleForWord short word: ', speed + '% speed');
        });

        test('regexEveryModuleForWord', () => {
            const speed = compare(re.regexEveryModuleForWordForCompletion('TestSuite_Fill'), RefRegexes.regexEveryModuleForWordForCompletion('TestSuite_Fill'), BASE_COUNT);
            console.log('regexEveryModuleForWord: ', speed + '% speed');
        });

        test('regexEveryMacroForWord short word', () => {
            const speed = compare(re.regexEveryMacroForWordForCompletion('a'), RefRegexes.regexEveryMacroForWordForCompletion('a'), BASE_COUNT);
            console.log('regexEveryMacroForWord short word: ', speed + '% speed');
        });

        test('regexEveryMacroForWord', () => {
            const speed = compare(re.regexEveryMacroForWordForCompletion('WAIT_SPACE'), RefRegexes.regexEveryMacroForWordForCompletion('WAIT_SPACE'), BASE_COUNT);
            console.log('regexEveryMacroForWord: ', speed + '% speed');
        });


    });

});