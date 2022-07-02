
/**
 * All regexes that are used for the definition provider.
 */
export class DefinitionRegexes {

	/**
	 * Searches for a (sjasmplus) STRUCT that contains the given word.
	 * Capture groups:
	 *  1 = preceding characters before 'searchWord'.
	 * Used by DefinitionProvider.
	 */
	public static regexStructForWord(searchWord: string): RegExp {
		//return new RegExp('^(\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
		return new RegExp('^(.*?\\s+(struct|STRUCT)\\s+)' + searchWord + '\\b');
	}
}
