import * as assert from 'assert';
import * as re from '../src/regexes';


/**
 * These here are the reference regexes from the 2.9.1 version.
 * The regex performance is measured against those functions.
 */
class RefRegexes {
    public static regexLabelColon(): RegExp {
        return /(^\s*@?)\b([a-z_][\w\.]*):/i;
    }
    public static regexLabelWithoutColon = /^()([a-z_][\w\.]*)\b(?![:\.])/i;
    public static regexLabelEquOrMacro = /^[\w\.]+:?\s*\b(equ|macro)/i;
    public static regexInclude = /\s*INCLUDE\s+"(.*)"/i;
    public static regexModuleStruct = /^\s+(MODULE|STRUCT)\s+([\w\.]+)/i;
    public static regexEndModuleStruct = /^\s+(ENDMODULE|ENDS)\b/i;
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
const BASE_COUNT = 1000000;


suite('Performance', () => {

    /**
     * Returns the number of ms it takes to call the function a number of times.
     * @param func The function to call.
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
    * @param func The function to call.
    * @param refFunc The reference function to call. func is compared with refFunc
    * @param count The number of times to call func.
    * @returns The relation ship func_time/refFunc_time*100 in percent.
    */
    function compare(regex: RegExp, refRegex: RegExp, count = BASE_COUNT): number {
        // To get better results also the execution time of an empty regex is calculated and subtracted from both times.
        measure(new RegExp(''), count); // Throw away first measure.
        const emptyRegexTime = measure(/'.*'/, count);

        // Call reference regex
        const refRegexTime = measure(refRegex, count);

        // Call regex
        const regexTime = measure(regex, count);

        // Do some safety checks
        assert.ok(emptyRegexTime < refRegexTime, 'emptyRegexTime= ' + emptyRegexTime + ', refRegexTime=' + refRegexTime);
        assert.ok(emptyRegexTime < regexTime, 'emptyRegexTime= ' + emptyRegexTime + ', regexTime=' + regexTime);

        const rel = (regexTime - emptyRegexTime) / (refRegexTime - emptyRegexTime);
        return rel*100;
    }


    suite('regexes', () => {

        test('regexLabelColon', () => {
            const speed = compare(re.regexLabelColon(), RefRegexes.regexLabelColon(), BASE_COUNT);
            console.log('regexLabelColon: ' + speed + '% speed');
        });

    });

});