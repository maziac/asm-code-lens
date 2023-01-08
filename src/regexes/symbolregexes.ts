import { AllowedLanguageIds } from '../languageId';


/**
 * All regexes that are used for the documentation symbol provider.
 */
export class DocSymbolRegexes {

	/**
	 * Returns labels with and without a colon.
	 * Capture groups for "@label:"
	 * 1 = "@label:"
	 * 2 = "@label"
	 */
	public static regexLabelWithAndWithoutColon(languageId: AllowedLanguageIds): RegExp {
		if (languageId === 'asm-list-file')
			return DocSymbolRegexes.regexLabelWithColon(languageId);	// Only with colon
		return /^((@?[a-z_][\w\.]*):?)/i;
	}


	/**
	 * Returns labels with a colon.
	 * Capture groups for "@label:"
	 * 1 = "@label:"
	 * 2 = "@label"
	 */
	public static regexLabelWithColon(languageId: AllowedLanguageIds): RegExp {
		if (languageId === 'asm-list-file')
			return /^[^#].*\s((@?[a-z_][\w\.]*):)/i;	// Only with colon
		return /^((@?[a-z_][\w\.]*):)/i;
	}


	/**
	 * Returns labels without a colon.
	 * Capture groups for "@label:"
	 * 1 = "@label"
	 * 2 = "@label"
	 * Note: there is no version for list files as labels without colons cannot be
	 * safely determined.
	 */
	public static regexLabelWithoutColon(): RegExp {
		return /^(@?[a-z_][\w\.]*)(?:\s|$)/i;
	}


	/**
	 * Returns labels after MODULE and if MODULE or ENDMODULE was found.
	 * Capture groups for " MODULE mod"
	 * 1 = "MODULE mod"
	 * 2 = "mod"
	 * Capture groups for " ENDMODULE"
	 * 1 = "ENDMODULE"
	 * Note: The same regex can be returned for asm and list files.
	 */
	public static regexModuleLabel(): RegExp {
		return /\b(module\s+([a-z_][\w\.]*)|endmodule.*)/i;
	}


	/**
	 * Returns labels after STRUCT and if STRUCT or ENDS was found.
	 * Capture groups for " STRUCT str"
	 * 1 = "STRUCT str"
	 * 2 = "str"
	 * Capture groups for " ENDS"
	 * 1 = "ENDS"
	 * Note: The same regex can be returned for asm and list files.
	 */
	public static regexStructLabel(): RegExp {
		return /\b(struct\s+([a-z_][\w\.]*)|ends.*)/i;
	}


	/** Checks for a const.
	 * Capture groups for " EQU label"
	 * 1 = "EQU"
	 * 2 = "label"
	 * Note: The same regex can be returned for asm and list files.
	 */
	public static regexConst(): RegExp {
		return /\b(equ)\s+(.*)/i;
	}


	/** Checks for a data.
	 * Capture groups for " DEFB 0, 1, 2, 3"
	 * 1 = "DEFB"
	 * 2 = "0, 1, 2, 3"
	 * Note: The same regex can be returned for asm and list files.
	 */
	public static regexData(): RegExp {
		return /\b(d[bcdghmsw]|def[bdghmsw])\b\s*(.*)/i;
	}


	/** Checks for a macro.
	 * Capture groups for " macro label"
	 * 1 = "MACRO"
	 * 2 = "label"
	 * Note: For list files undefined is returned.
	 */
	public static regexMacro(languageId: AllowedLanguageIds): RegExp | undefined {
		if (languageId === 'asm-list-file')
			return undefined;
		return /\b(macro)\s+(.*)/i;
	}
}

