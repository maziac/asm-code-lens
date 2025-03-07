import { AllowedLanguageIds } from './../languageId';
import { RegexIndexOf, RegexTwo } from './extendedregex';



/**
 * Common regexes. I.e. regexes used by more than one provider.
 */
export class CommonRegexes {

    /**
     * Returns labels with and without a colon.
     * Not to be used for list files.
     * Capture groups:
     *  1 = '@' or ''
     *  2 = the label itself e.g. "init.label_1"
     */
    public static regexLabelWithAndWithoutColon(): RegExp {
        return /(^@?)([a-z_][\w.]*):?/i;
    }


    /**
     * Checks for a label with a colon, e.g.
     * "label:", " label:" or "init.label_1:".
     * Also "@label:".
     * But not ".label:".
     * Capture groups:
     *  1 = preceding spaces (and other chars in case of list file) otherwise '@' or ''
     *  2 = the label itself e.g. "init.label_1
     * Used by findLabelsWithNoReference, provideCodeLenses.
	 * @param languageId either "asm-collection" or "asm-list-file".
	 * A different regex is returned dependent on languageId.
     */
    public static regexLabelWithColon(languageId: AllowedLanguageIds): RegExp {
        if (languageId === 'asm-list-file') {
            return new RegexIndexOf(':', /(^[^#]*\s@?)([a-z_][\w.]*):/i);
        }
		// "asm-collection"
        return /(^@?)([a-z_][\w.]*):/i;
    }


    /**
     * Checks for a label without a colon, i.e. a
     * label used by sjasmplus.
     * E.g. "label" or "init.label_1".
     * Also "@label".
     * But not ".label".
     * Capture groups:
     *  1 = '@' or ''
     *  2 = the label itself e.g. "init.label_1"
     * Used by findLabelsWithNoReference, provideCodeLenses.
     */
    public static regexLabelWithoutColon(): RegExp {
        return /^(@?)([a-z_][\w.]*)(?:\s|$)/i;
    }


    /**
     * Returns an array of regexes with 1 or 2 regexes.
     * @param labelsWithColons Add regex with colons
     * @param labelsWithoutColons Add regex without colons
	 * @param languageId either "asm-collection" or "asm-list-file".
	 * A different regex is returned dependent on languageId.
     */
    public static regexLabel(cfg: {labelsWithColons: boolean, labelsWithoutColons: boolean}, languageId: AllowedLanguageIds): RegExp {
        if (languageId === "asm-list-file")   // List file: only with colons
            return CommonRegexes.regexLabelWithColon(languageId);

        // Now for "asm-collection"
        if (cfg.labelsWithColons && cfg.labelsWithoutColons)
            return CommonRegexes.regexLabelWithAndWithoutColon();
        if (cfg.labelsWithoutColons)
            return CommonRegexes.regexLabelWithoutColon();
        // LAbels with colons is the default
        return CommonRegexes.regexLabelWithColon(languageId);
    }


    /**
     * Checks for an INCLUDE directive.
     * E.g. 'include "something"' or ' include "something"'.
     * Capture groups:
     *  1 = what is included, i.e. what is inside the ""
     * Used by DefinitionProvider, RenameProvider.
     */
    public static regexInclude(): RegExp {
        //return /\s*INCLUDE\s+"(.*)"/i;
        return new RegexTwo(/INCLUDE/i, /\s*INCLUDE\s+"(.*)"/i);
    }


    /**
     * Checks for a MODULE or STRUCT directive.
     * Used by getModule.
     */
    public static regexModuleStruct(): RegExp {
        //return /^\s+(MODULE|STRUCT)\s+([\w\.]+)/i;
        //return /^.*\s(MODULE|STRUCT)\s+([\w\.]+)/i;
        return new RegexTwo(/(MODULE|STRUCT)/i, /^.*\s(MODULE|STRUCT)\s+([\w.]+)/i);
    }


    /**
     * Checks for a ENDMODULE or ENDS directive.
     * Used by getModule.
     */
    public static regexEndModuleStruct(): RegExp {
        //return /^.*?\s+(ENDMODULE|ENDS)\b/i;
        return new RegexTwo(/(ENDMODULE|ENDS)/i, /^.*\s(ENDMODULE|ENDS)\b/i);
    }


    /**
     * Calculates the start index by adding the length of each match.
     * (Exported for unit tests)
     */
    public static calcStartIndex(match: RegExpExecArray): number {
        let start = match.index;
        for (let j = 1; j < match.length; j++) {
            // This capture group surrounds the start til the searched word begins. It is used to adjust the found start index.
            if (match[j]) {
                // Note: an optional group might be undefined
                const i = match[j].length;
                start += i;
            }
        }
        return start;
    }


    /**
     * Searches for labels that contain the given word.
     * Checks for a label with a colon.
     * Capture groups:
     *  1 = preceding characters before 'searchWord'.
     * Used by DefinitionProvider.
	 * @param languageId either "asm-collection" or "asm-list-file".
	 * A different regex is returned dependent on languageId.
     */
    public static regexLabelColonForWord(searchWord: string, languageId: AllowedLanguageIds): RegExp {
        if (languageId == 'asm-list-file') {
            return new RegexTwo(new RegExp(searchWord, 'i'), new RegExp('^(.*?\\s)([[a-zA-Z_\\.][\\w\\.]*)?\\b' + searchWord + ':'));
        }
		// "asm-collection"
        return new RegExp('^()([a-zA-Z_\\.][\\w\\.]*)?\\b' + searchWord + ':');
    }


    /**
     * Searches for labels that contains the given word.
     * Checks for a label without a colon.
     * Capture groups:
     *  1 = preceding characters before 'searchWord'.
     * Used by DefinitionProvider.
     */
    public static regexLabelWithoutColonForWord(searchWord: string): RegExp {
        return new RegExp('^()([a-zA-Z_\\.][\\w\\.]*)?\\b' + searchWord + '\\b(?![:\\.])');
    }


    /**
     * Returns an array of regexes with 1 or 2 regexes.
     * @param labelsWithColons Add regex with colons
     * @param labelsWithoutColons Add regex without colons
	 * @param languageId either "asm-collection" or "asm-list-file".
	 * A different regex is returned dependent on languageId.
     */
    public static regexesLabelForWord(searchWord: string, cfg: {labelsWithColons: boolean, labelsWithoutColons: boolean}, languageId: AllowedLanguageIds): RegExp[] {
        const regexes: RegExp[] = [];
        // Find all "some.thing:" (labels) in the document
        if (cfg.labelsWithColons) {
            const searchRegex = CommonRegexes.regexLabelColonForWord(searchWord, languageId);
            regexes.push(searchRegex);
        }
        // Find all sjasmplus labels without ":" in the document
        if (cfg.labelsWithoutColons && languageId == 'asm-collection') {
            const searchRegex2 = CommonRegexes.regexLabelWithoutColonForWord(searchWord);
            regexes.push(searchRegex2);
        }
        return regexes;
    }


    /**
     * Searches for a (sjasmplus) MODULE that contains the given word.
     * Capture groups:
     *  1 = preceding characters before 'searchWord'.
     * Used by DefinitionProvider.
     */
    public static regexModuleForWord(searchWord: string): RegExp {
        //return new RegExp('^(\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
        return new RegexTwo(/module/i, new RegExp('^(.*\\s(module|MODULE)\\s+)' + searchWord + '\\b'));
        //return new RegExp('^(.*\\s(module|MODULE)\\s+)' + searchWord + '\\b');
    }


    /**
     * Searches for a (sjasmplus) MACRO that contains the given word.
     * Capture groups:
     *  1 = preceding characters before 'searchWord'.
     * Used by DefinitionProvider and HoverProvider.
     */
    public static regexMacroForWord(searchWord: string): RegExp {
        //return new RegExp('^(\\s+(macro|MACRO)\\s+)' + searchWord + '\\b');
        return new RegexTwo(/macro/i, new RegExp('^(.*\\s(macro|MACRO)\\s+)' + searchWord + '\\b'));
    }


    /**
     * Searches any reference for a given word (label).
     * Capture groups:
     *  1 = preceding characters before 'searchWord'.
     * Used by resolveCodeLens.
     */
    public static regexAnyReferenceForWord(searchWord: string): RegExp {
        return new RegexIndexOf(searchWord, new RegExp('^([^#]*)\\b' + searchWord + '\\b'));
    }


    /**
     * Prepares a string for fuzzy search.
     * I.e. allows to input a string like "snd" and it will find
     * with a regular expression also "sound", "sounds", "snd" etc.
     * but not e.g. "sn".
     * Used by CompletionProposalsProvider and every provider (reduceLocations).
     */
    public static regexPrepareFuzzy(searchWord: string): string {
        const replaced = searchWord.replace(/(.)/g, '\\w*$1');
        return replaced;
    }
}
