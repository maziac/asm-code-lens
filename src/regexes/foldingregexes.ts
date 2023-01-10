
/**
 * All regexes that are used for folding.
 */
export class FoldingRegexes {
	/** Gets a regex with the characters used for single line comments.
	 * @param prefix Text from toggleCommentPrefix.
	 * @returns E.g. /^(;|//)/
	 */
	public static regexCommentSingleLine(prefix?: string): RegExp {
		const commentsSet = new Set<string>([';', '//']);
		if (prefix)
			commentsSet.add(prefix);
		const prefixes = Array.from(commentsSet);

		// Comment prefixes to strip the comment from the line
		const rc = '^(' + prefixes.join('|') + ')';
		const regex = new RegExp(rc);

		return regex;
	}


	/** Returns the regex used as a start for multi line comments.
	 * @returns /^\/\* /
	 */
	public static regexCommentMultipleStart(): RegExp {
		return /^\/\*/;
	}

	/** Returns the regex used as an end for multi line comments.
	 * @returns E.g. /\*\//
	 */
	public static regexCommentMultipleEnd(): RegExp {
		return /\*\//;
	}


	/** Returns the regex used for the start of a module.
	 * @returns E.g. /\*\//
	 */
	public static regexModuleStart(): RegExp {
		return /\s+module\b/i;
	}


	/** Returns the regex used for the end of a module.
	 * @returns E.g. /\*\//
	 */
	public static regexModuleEnd(): RegExp {
		return /\s+endmodule\b/i;
	}

	/** Returns the regex used for the start of a struct.
	 * @returns E.g. /\*\//
	 */
	public static regexStructStart(): RegExp {
		return /\s+struct\b/i;
	}


	/** Returns the regex used for the end of a struct.
	 * @returns E.g. /\*\//
	 */
	public static regexStructEnd(): RegExp {
		return /\s+ends\b/i;
	}

	/** Returns the regex used for the start of a macro.
	 * @returns E.g. /\*\//
	 */
	public static regexMacroStart(): RegExp {
		return /\s+macro\b/i;
	}


	/** Returns the regex used for the end of a macro.
	 * @returns E.g. /\*\//
	 */
	public static regexMacroEnd(): RegExp {
		return /\s+endm\b/i;
	}


}

