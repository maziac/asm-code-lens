
/**
 * Checks for a label with a colon, e.g.
 * "label:", " label:" or "init.label_1:".
 * Also "@label:".
 * But not ".label:".
 * Capture groups:
 *  1 = preceding spaces (and other chars in case of list file)
 *  2 = the label itself e.g. "init.label_1
 * Used by findLabelsWithNoReference, provideCodeLenses.
 */
export function regexLabelColon(): RegExp {
//    return /(^\s*@?)\b([a-z_][\w\.]*):/i;
    return /(^@?|^.*?\s@?)([a-z_][\w\.]*):/i;
}


/**
 * Checks for a label without a colon, i.e. a
 * label used by sjasmplus.
 * E.g. "label" or "init.label_1".
 * Also "@label".
 * But not ".label".
 * Capture groups:
 *  1 = ''
 *  2 = the label itself e.g. "init.label_1"
 * Used by findLabelsWithNoReference, provideCodeLenses.
 */
export function regexLabelWithoutColon(): RegExp {
    return /^(@?)([a-z_][\w\.]*)(?:\s|$)/i;
    //return /^()([a-z_][\w\.]*)\b(?![:\.])/i;
}


/**
 * Returns an array of regexes with 1 or 2 regexes.
 * @param labelsWithColons Add regex with colons
 * @param labelsWithoutColons Add regex without colons
 */
export function regexesLabel(cfg: {labelsWithColons: boolean, labelsWithoutColons: boolean}): RegExp[] {
    const regexes: RegExp[] = [];
    // Find all "some.thing:" (labels) in the document
    if (cfg.labelsWithColons) {
        const searchRegex = regexLabelColon();
        regexes.push(searchRegex);
    }
    // Find all sjasmplus labels without ":" in the document
    if (cfg.labelsWithoutColons) {
        const searchRegex2 = regexLabelWithoutColon();
        regexes.push(searchRegex2);
    }
    return regexes;
}


/**
 * Checks for a label followed by MACRO or EQU.
 * E.g. "label: MACRO" or "label2: equ" or "label equ".
 * Capture groups:
 *  None.
 * Used by findLabelsWithNoReference.
 */
export function regexLabelEquOrMacro(): RegExp {
    //return /^[\w\.]+:?\s*\b(equ|macro)/i;
    return /^.*?[\w\.]+:?\s*\b(equ|macro)/i;
}


/**
 * Checks for an INCLUDE directive.
 * E.g. 'include "something"' or ' include "something"'.
 * Capture groups:
 *  1 = what is included, i.e. what is inside the ""
 * Used by DefinitionProvider, RenameProvider.
 */
export function regexInclude(): RegExp {
    return /\s*INCLUDE\s+"(.*)"/i;
}



/**
 * Checks for a MODULE or STRUCT directive.
 * Used by getModule.
 */
export function regexModuleStruct(): RegExp {
    //return /^\s+(MODULE|STRUCT)\s+([\w\.]+)/i;
    return /^.*?\s+(MODULE|STRUCT)\s+([\w\.]+)/i;
}


/**
 * Checks for a ENDMODULE or ENDS directive.
 * Used by getModule.
 */
export function regexEndModuleStruct(): RegExp {
    return /^.*?\s+(ENDMODULE|ENDS)\b/i;
}


/**
 * Calculates the start index by adding the length of each matches.
 * (Exported for unit tests)
 */
export function calcStartIndex(match: RegExpExecArray): number {
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
 */
export function regexLabelColonForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s*)([^0-9\\s][\\w\\.]*)?\\b' + searchWord + ':');
    return new RegExp('(^|^.*?\\s)([^0-9\\s][\\w\\.]*)?\\b' + searchWord + ':');
}


/**
 * Searches for labels that contains the given word.
 * Checks for a label without a colon.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexLabelWithoutColonForWord(searchWord: string): RegExp {
    return new RegExp('^()([^0-9\\s][\\w\\.]*)?\\b' + searchWord + '\\b(?![:\\.])');
}


/**
 * Returns an array of regexes with 1 or 2 regexes.
 * @param labelsWithColons Add regex with colons
 * @param labelsWithoutColons Add regex without colons
 */
export function regexesLabelForWord(searchWord: string, cfg: {labelsWithColons: boolean, labelsWithoutColons: boolean}): RegExp[] {
    const regexes: RegExp[] = [];
    // Find all "some.thing:" (labels) in the document
    if (cfg.labelsWithColons) {
        const searchRegex = regexLabelColonForWord(searchWord);
        regexes.push(searchRegex);
    }
    // Find all sjasmplus labels without ":" in the document
    if (cfg.labelsWithoutColons) {
        const searchRegex2 = regexLabelWithoutColonForWord(searchWord);
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
export function regexModuleForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
    return new RegExp('^(.*?\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
}


/**
 * Searches for a (sjasmplus) MACRO that contains the given word.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexMacroForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s+(macro|MACRO)\\s+)' + searchWord + '\\b');
    return new RegExp('^(.*?\\s+(macro|MACRO)\\s+)' + searchWord + '\\b');
}


/**
 * Searches for a (sjasmplus) STRUCT that contains the given word.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexStructForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
    return new RegExp('^(.*?\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
}



/**
 * Searches any reference for a given word (label).
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by resolveCodeLens.
 */
export function regexAnyReferenceForWord(searchWord: string): RegExp {
    return new RegExp('^(.*)\\b' + searchWord + '\\b');
}




/**
 * Searches any reference for a given word (label).
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by RenameProvider.
 */
export function regexAnyReferenceForWordGlobal(searchWord: string): RegExp {
    return new RegExp('(.*?)\\b' + searchWord + '\\b', 'g');
}



/**
 * Prepares a string for fuzzy search.
 * I.e. allows to input a string like "snd" and it will find
 * with a regular expression also "sound", "sounds", "snd" etc.
 * but not e.g. "sn".
 * Used by CompletionProposalsProvider.
 */
export function regexPrepareFuzzy(searchWord: string): string {
    const replaced = searchWord.replace(/(.)/g,'\\w*$1');
    return replaced;
}



/**
 * Searches for labels that contains the given word.
 * Checks for a label with a colon.
 * The label can be everywhere. I.e. it can be a middle part of a dot
 * notated label.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by CompletionProposalsProvider.
 */
export function regexEveryLabelColonForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s*[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
    return new RegExp('(^@?[\\w\\.]*|^.*\\s@?[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
}


/**
 * Searches for labels that contains the given word.
 * Checks for a label without a colon.
 * The label can be everywhere. I.e. it can be a middle part of a dot
 * notated label.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by CompletionProposalsProvider.
 */
export function regexEveryLabelWithoutColonForWord(searchWord: string): RegExp {
    //searchWord=searchWord.replace(/\./g, '\\.');
    return new RegExp('^(([^0-9 ][\\w\\.]*)?)\\b' + searchWord + '[\\w\\.]*\\b(?![:\\w\\.])', 'i');
}


/**
 * Returns an array of regexes with 1 or 2 regexes.
 * @param labelsWithColons Add regex with colons
 * @param labelsWithoutColons Add regex without colons
 */
export function regexesEveryLabelForWord(searchWord: string, cfg: {labelsWithColons: boolean, labelsWithoutColons: boolean}): RegExp[] {
    const regexes: RegExp[] = [];
    // Find all "some.thing:" (labels) in the document
    if (cfg.labelsWithColons) {
        const searchRegex = regexEveryLabelColonForWord(searchWord);
        regexes.push(searchRegex);
    }
    // Find all sjasmplus labels without ":" in the document
    if (cfg.labelsWithoutColons) {
        const searchRegex2 = regexEveryLabelWithoutColonForWord(searchWord);
        regexes.push(searchRegex2);
    }
    return regexes;
}


/**
 * Searches for a (sjasmplus) MODULE that contains the given word.
 * The label can be everywhere. I.e. it can be a middle part of a dot
 * notated label.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by CompletionProposalsProvider.
 */
export function regexEveryModuleForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s+(MODULE)\\s+)' + searchWord + '[\\w\\.]*', 'i');
    return new RegExp('^(.*?\\s+(MODULE)\\s+)' + searchWord + '[\\w\\.]*', 'i');
}


/**
 * Searches for a (sjasmplus) MACRO that contains the given word.
 * The label can be everywhere. I.e. it can be a middle part of a dot
 * notated label.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by CompletionProposalsProvider.
 */
export function regexEveryMacroForWord(searchWord: string): RegExp {
    //return new RegExp('^(\\s+(MACRO)\\s+)' + searchWord + '[\\w\\.]*', 'i');
    return new RegExp('^(.*?\\s+(MACRO)\\s+)' + searchWord + '[\\w\\.]*', 'i');
}

