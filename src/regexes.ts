

/**
 * Checks for a label with a colon, e.g.
 * "label:" or "init.label_1".
 * But not ".label".
 */
export function regexLabelColon(): RegExp {
    return /^\s*\b([a-z_][\w\.]*):/i;
}


/**
 * Checks for a label without a colon, i.e. a
 * label used by sjasmplus.
 * E.g. "label" or "init.label_1".
 * But not ".label".
 */
export function regexLabelWithoutColon(): RegExp {
    return /^([a-z_][\w\.]*)\b/i;
}

