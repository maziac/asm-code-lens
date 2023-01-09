
/**
 * All regexes that are used for folding.
 */
export class FoldingRegexes {
	/** Gets a regex with the the characters used for single line comments.
	 * @param prefix Text from toggleCommentPrefix.
	 * @returns E.g. /^(;|//)/
	 */
	public static regexSingleLineComments(prefix?: string): RegExp {
		const commentsSet = new Set<string>([';', '//']);
		if (prefix)
			commentsSet.add(prefix);
		const prefixes = Array.from(commentsSet);

		// Comment prefixes to strip the comment from the line
		const rc = '^(' + prefixes.join('|') + ')';
		const regex = new RegExp(rc);

		return regex;
	}
}

