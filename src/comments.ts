

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
 * Additionally all quoted text is blanked out.
 * @param text Text with comment.
 * @returns string before the first ";"
 */
export function stripComment(text: string): string {
	// Replace all text in quotes with spaces.
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

	// Now strip the comment
	let i = Number.MAX_SAFE_INTEGER;
	for (const commentPrefix of commentPrefixes) {
		const k = text.indexOf(commentPrefix);
		if (k >= 0 && k < i) {
			i = k;
		}
	}
	if (i != Number.MAX_SAFE_INTEGER)
		text = text.substring(0, i);   // strip comment

	// No comment
	return text;
}


/**
 * Strips all comments, line (; //) and multiline (/* ...).
 * Additionally all quoted text is blanked out.
 * @param lines [in, out] An array of strings. During processing the array is modified.
 * I.e. lines with comments are stripped.
 */
export function stripAllComments(lines: Array<string>) {
	const len = lines.length;
	for (let i = 0; i < len; i++) {
		const line = lines[i];
		const strippedLine = stripComment(line);
		lines[i] = strippedLine;
	}
}
export function stripAllCommentsMultiline(lines: Array<string>) {
	let insideMultilineComment = false;
	const len = lines.length;
	for (let i = 0; i < len; i++) {
		const line = lines[i];

		// Strip single line comments and blank out quotes.
		let modLine = stripComment(line);

		// Strip out multiline comments /*...*/
		if (insideMultilineComment) {
			// Find the next closing */
			//...
		}
		else {
			// Search for occurrence of /*
			let j2 = 0;
			while (true) {
				const j1 = modLine.indexOf('/*', j2);
				if (j1 < 0)
					break;
				// Search for occurrence of */
				j2 = modLine.indexOf('*/', j1 + 2);
				if (j2 < 0) {
					// No closing */ found
					j2 = modLine.length - 2;
					// I.e. this was the start of a multiline comment
					insideMultilineComment = true;
				}
				modLine = modLine.substring(0, j1) + ' '.repeat(j2 - j1 + 2) + modLine.substring(j2 + 2);
				// Next
				j2 += 2;
			} while (j2 < modLine.length);
		}


		lines[i] = modLine;

	}
}
