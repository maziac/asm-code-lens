import {RegexTwo} from "./extendedregex";


/**
 * All regexes that are used for the rename provider.
 */
export class RenameRegexes {

	/**
	 * Searches any reference for a given word (label).
	 * Capture groups:
	 *  1 = preceding characters before 'searchWord'.
	 * Used by RenameProvider.
	 */
	public static regexAnyReferenceForWordGlobal(searchWord: string): RegExp {
		//return new RegexIndexOf(searchWord, new RegExp('(.*?)\\b' + searchWord + '\\b', 'g'));
		return new RegexTwo(new RegExp('\\b' + searchWord + '\\b'), new RegExp('(.*?)\\b' + searchWord + '\\b', 'g'));
	}

}
