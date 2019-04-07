
/**
 * Checks for a label with a colon, e.g.
 * "label:", " label:" or "init.label_1:".
 * But not ".label:".
 * Capture groups:
 *  1 = preceding spaces
 *  2 = the label itself e.g. "init.label_1
 * Used by findLabelsWithNoReference, provideCodeLenses.
 */
export function regexLabelColon(): RegExp {
    return /(^\s*)\b([a-z_][\w\.]*):/i;
}


/**
 * Checks for a label without a colon, i.e. a
 * label used by sjasmplus.
 * E.g. "label" or "init.label_1".
 * But not ".label".
 * Capture groups:
 *  1 = ''
 *  2 = the label itself e.g. "init.label_1
 * Used by findLabelsWithNoReference, provideCodeLenses.
 */
export function regexLabelWithoutColon(): RegExp {
    return /^()([a-z_][\w\.]*)\b(?![:\.])/i;
}




/**
 * Checks for a label followed by MACRO or EQU.
 * E.g. "label: MACRO" or "label2: equ" or "label equ".
 * Capture groups:
 *  None.
 * Used by findLabelsWithNoReference.
 */
export function regexLabelEquOrMacro(): RegExp {
    return /^[\w\.]+:?\s*\b(equ|macro)/i;
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
 * Searches for labels that contains the given word.
 * Checks for a label with a colon.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexLabelColonForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s*)([^0-9\\. ][\\w\\.]*)?\\b' + searchWord + ':');
}


/**
 * Searches for labels that contains the given word.
 * Checks for a label without a colon.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexLabelWithoutColonForWord(searchWord: string): RegExp {
    return new RegExp('^()([^0-9\\. ][\\w\\.]*)?\\b' + searchWord + '\\b(?![:\\.])');
}


/**
 * Searches for a (sjasmplus) MODULE that contains the given word.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexModuleForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
}


/**
 * Searches for a (sjasmplus) MACRO that contains the given word.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexMacroForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(macro|MACRO)\\s+)' + searchWord + '\\b');
}


/**
 * Searches for a (sjasmplus) STRUCT that contains the given word.
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by DefinitionProvider.
 */
export function regexStructForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
}



/**
 * Searches any reference for a given word (label).
 * Capture groups:
 *  1 = preceding characters before 'searchWord'.
 * Used by resolveCodeLens.
 */
export function regexAnyReferenceForWord(searchWord: string): RegExp {
    return new RegExp('^([^"]*)\\b' + searchWord + '\\b');
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
    return new RegExp('^(\\s*[\\w\\.]*)\\b' + searchWord + '[\\w\\.]*:', 'i');
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
    return new RegExp('^(([^0-9 ][\\w\\.]*)?)\\b' + searchWord + '[\\w\\.]*\\b(?![:\\w\\.])', 'i');
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
    return new RegExp('^(\\s+(MODULE)\\s+)' + searchWord + '[\\w\\.]*', 'i');
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
    return new RegExp('^(\\s+(MACRO)\\s+)' + searchWord + '[\\w\\.]*', 'i');
}

