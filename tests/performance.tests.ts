//import * as assert from 'assert';
import * as re from '../src/regexes';


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
const BASE_COUNT = 100000;


suite('Performance', () => {

    /**
     * Returns the number of ms it takes to call the function a number of times.
     * @param regex The regex to call.
     * @param count The number of times to call func.
     * @returns The duration in ms.
     */
    function measure(regex: RegExp, count = BASE_COUNT): number {
        const lines = [
            "6017.R11 00 AF     label: equ ",
            "39+ 6017           label: macro",
            "29    0012  D3 FE  label: equ ",
            "625++C4D1          label: equ ",
            "626++C4D1 FE 10    label: equ ",
        ];
        const prevTime = Date.now();
        for (let i = count; i > 0; i--) {
            for (const line of lines)
                regex.exec(line);
        }
        const afterTime = Date.now();
        return afterTime - prevTime;
    }

    /**
    * Compares execution times of 2 functions.
    * @param regex The regex to call.
    * @param refRegex The reference regex to call. regex is compared with refFunc
    * @param count The number of times to call func.
    * @returns The relation ship refregex_time/regex_time*100 in percent.
    */
    function compare(regex: RegExp, refRegex: RegExp, count = BASE_COUNT): number {
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
            const speed = compare(re.regexLabelColonForWord('ulabel'), RefRegexes.regexLabelColonForWord('ulabel'), BASE_COUNT);
            console.log('regexLabelColonForWord: ', speed + '% speed');
        });

        test('regexLabelWithoutColonForWord', () => {
            const speed = compare(re.regexLabelWithoutColonForWord('ulabel'), RefRegexes.regexLabelWithoutColonForWord('ulabel'), BASE_COUNT);
            console.log('regexLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexModuleForWord', () => {
            const speed = compare(re.regexModuleForWord('ulabel'), RefRegexes.regexModuleForWord('ulabel'), BASE_COUNT);
            console.log('regexModuleForWord: ', speed + '% speed');
        });

        test('regexMacroForWord', () => {
            const speed = compare(re.regexMacroForWord('ulabel'), RefRegexes.regexMacroForWord('ulabel'), BASE_COUNT);
            console.log('regexMacroForWord: ', speed + '% speed');
        });

        test('regexStructForWord', () => {
            const speed = compare(re.regexStructForWord('ulabel'), RefRegexes.regexStructForWord('ulabel'), BASE_COUNT);
            console.log('regexStructForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWord', () => {
            const speed = compare(re.regexAnyReferenceForWord('ulabel'), RefRegexes.regexAnyReferenceForWord('ulabel'), BASE_COUNT);
            console.log('regexAnyReferenceForWord: ', speed + '% speed');
        });

        test('regexAnyReferenceForWordGlobal', () => {
            const speed = compare(re.regexAnyReferenceForWordGlobal('ulabel'), RefRegexes.regexAnyReferenceForWordGlobal('ulabel'), BASE_COUNT);
            console.log('regexAnyReferenceForWordGlobal: ', speed + '% speed');
        });

        test('regexEveryLabelColonForWord', () => {
            const speed = compare(re.regexEveryLabelColonForWord('ulabel'), RefRegexes.regexEveryLabelColonForWord('ulabel'), BASE_COUNT);
            console.log('regexEveryLabelColonForWord: ', speed + '% speed');
        });

        test('regexEveryLabelWithoutColonForWord', () => {
            const speed = compare(re.regexEveryLabelWithoutColonForWord('ulabel'), RefRegexes.regexEveryLabelWithoutColonForWord('ulabel'), BASE_COUNT);
            console.log('regexEveryLabelWithoutColonForWord: ', speed + '% speed');
        });

        test('regexEveryModuleForWord', () => {
            const speed = compare(re.regexEveryModuleForWord('ulabel'), RefRegexes.regexEveryModuleForWord('ulabel'), BASE_COUNT);
            console.log('regexEveryModuleForWord: ', speed + '% speed');
        });

        test('regexEveryMacroForWord', () => {
            const speed = compare(re.regexEveryMacroForWord('ulabel'), RefRegexes.regexEveryMacroForWord('ulabel'), BASE_COUNT);
            console.log('regexEveryMacroForWord: ', speed + '% speed');
        });


    });

});