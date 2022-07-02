
/**
 * All regexes that are used for the commands.
 */
export class CommandsRegexes {

	/**
	 * Checks for a label followed by MACRO or EQU.
	 * E.g. "label: MACRO" or "label2: equ" or "label equ".
	 * Capture groups:
	 *  None.
	 * Used by findLabelsWithNoReference.
	 */
	public static regexLabelEquOrMacro(): RegExp {
		//return /^[\w\.]+:?\s*\b(equ|macro)/i;
		return /^.*?[\w\.]+:?\s*\b(equ|macro)/i;
	}


}
