
/**
 * Checks for a label with a colon, e.g.
 * "label:", " label:" or "init.label_1:".
 * But not ".label:".
 * Used by Command.
 */
export function regexLabelColon(): RegExp {
    return /^\s*\b([a-z_][\w\.]*):/i;
}


/**
 * Checks for a label without a colon, i.e. a
 * label used by sjasmplus.
 * E.g. "label" or "init.label_1".
 * But not ".label".
 * Used by Command.
 */
export function regexLabelWithoutColon(): RegExp {
    return /^([a-z_][\w\.]*)\b/i;
}




/**
 * Searches for labels that contains the given word.
 * Checks for a label with a colon.
 * Used by DefinitionProvider.
 */
export function regexLabelColonForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s*)[\\w\\.]*\\b' + searchWord + ':');
}


/**
 * Searches for labels that contains the given word.
 * Checks for a label without a colon.
 * Used by DefinitionProvider.
 */
export function regexLabelWithoutColonForWord(searchWord: string): RegExp {
    return new RegExp('^()[\\w\\.]*\\b' + searchWord + '\\b(?![:\\.])');
}


/**
 * Searches for a (sjasmplus) MODULE that contains the given word.
 * Used by DefinitionProvider.
 */
export function regexModuleForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(module|MODULE)\\s+)' + searchWord + '\\b');
}


/**
 * Searches for a (sjasmplus) MACRO that contains the given word.
 * Used by DefinitionProvider.
 */
export function regexMacroForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(macro|MACRO)\\s+)' + searchWord + '\\b', 'i');
}


/**
 * Searches for a (sjasmplus) STRUCT that contains the given word.
 * Used by DefinitionProvider.
 */
export function regexStructForWord(searchWord: string): RegExp {
    return new RegExp('^(\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b', 'i');
}

