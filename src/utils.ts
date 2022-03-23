

// Is set on start and whenver the settings change.
// It holds all prefixes (like ';' and '//') that are used as comment prefixes.
let commentPrefixes: Array<string>;


/**
 * Sets the characters used as comments.
 * @param prefix Text from toggleCommentPrefix.
 */
export function setCustomCommentPrefix(prefix?: string) {
	const commentsSet = new Set<string>([';', '//']);
	if (prefix)
		commentsSet.add(prefix);
	commentPrefixes = Array.from(commentsSet);
}


/**
 * Strips the comment (;) from the text and returns it.
 * @param text Text with comment.
 * @returns string before the first ";"
 */
export function stripComment(text: string) {
	let i = Number.MAX_SAFE_INTEGER;
	for (const commentPrefix of commentPrefixes) {
		const k = text.indexOf(commentPrefix);
		if (k >= 0 && k < i) {
			i = k;
		}
	}
	if (i != Number.MAX_SAFE_INTEGER)
		text = text.substring(0, i);   // strip comment

	// Strip all text in quotes
	// Note: the implementation with regex is more elegant but slower:
	// 10x slower if quotes are found and 3 times slower without any quotes.

	// Not done with regex:
	//text = text.replace(/"[^"]*"/g, substr => ' '.repeat(substr.length));
	//text = text.replace(/".*/g, '');

	// Instead indexOf/substring is faster:
	let j2 = 0;
	while (true) {
		const j1 = text.indexOf('"', j2);
		if (j1 < 0)
			break;
		j2 = text.indexOf('"', j1 + 1);
		if (j2 < 0)
			j2 = text.length-1;
		text = text.substring(0, j1) + ' '.repeat(j2 - j1 + 1) + text.substring(j2 + 1);
		j2++;
	}

	// No comment
	return text;
}
