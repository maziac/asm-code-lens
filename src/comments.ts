

// Is set on start and whenever the settings change.
// It holds all prefixes (like ';' and '//') that are used as comment prefixes.
let commentEtcPrefixes: RegExp;
let singleLineCommentsSet: Set<string>;

/**
 * Sets the characters used as comments.
 * @param prefix Text from toggleCommentPrefix.
 */
export function setCustomCommentPrefix(prefix?: string) {
	singleLineCommentsSet = new Set<string>([';', '//']);
	if (prefix)
		singleLineCommentsSet.add(prefix);
	const prefixes = Array.from(singleLineCommentsSet);
	const r = '("|\'|/\\*|' + prefixes.join('|') + ')';
	console.log(r);
	commentEtcPrefixes = new RegExp(r, 'g');
}


/**
 * Strips all comments, line (; //) and multiline (/* ...).
 * Additionally all quoted text is blanked out.
 * @param lines [in, out] An array of strings. During processing the array is modified.
 * I.e. lines with comments are stripped.
 */
export function stripAllComments(lines: Array<string>) {
	let insideMultilineComment = false;
	const len = lines.length;

	for (let i = 0; i < len; i++) {
		let line = lines[i];
		if (insideMultilineComment) {
			// Search for multiline comment closing
			const j2 = line.indexOf('*/');
			if (j2 >= 0) {
				// blank out until */
				line = ' '.repeat(j2 + 2) + line.substring(j2 + 2);
				insideMultilineComment = false;
			}
			else {
				// Clear line
				lines[i] = '';
				continue;
			}
		}
		// insideMultilineComment is true if we reach here

		// Search for opening
		commentEtcPrefixes.lastIndex = 0;
		let match;
		while ((match = commentEtcPrefixes.exec(line))) { //'' matched immer?
			const j1 = match.index;
			// Which opening
			const opening = match[1];
			if (opening == '"' || opening == "'") {
				// Quote: Find closing quote
				const j2 = line.indexOf(opening, j1 + 1);
				if (j2 >= 0) {
					// blank out between quotes
					line = line.substring(0, j1) + ' '.repeat(j2 - j1 + 1) + line.substring(j2 + 1);
					commentEtcPrefixes.lastIndex = j2 + 1;
				}
				else {
					// Cut off
					line = line.substring(0, j1);
					break;
				}
			}
			else if (opening == '/*') {
				// Multiline comment: Find closing */
				const j2 = line.indexOf('*/', j1 + 2);
				if (j2 >= 0) {
					// blank out between /*...*/
					line = line.substring(0, j1) + ' '.repeat(j2 - j1 + 2) + line.substring(j2 + 2);
					commentEtcPrefixes.lastIndex = j2 + 2;
				}
				else {
					// Cut off
					line = line.substring(0, j1);
					insideMultilineComment = true;
					break;
				}
			}
			else if (singleLineCommentsSet.has(opening)) {
				// Single line comment: Cut off
				line = line.substring(0, j1);
				break;
			}
		}

		// Store line
		lines[i] = line;
	}
}
