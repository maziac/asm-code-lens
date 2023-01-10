// Is set on start and whenever the settings change.

// It holds all prefixes (like ';' and '//') that are used as comment prefixes.
let commentEtcPrefixes: RegExp;
let commentHoverPrefixes: RegExp;
let commentHoverPrefixesSameLine: RegExp;
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

	// Comment prefixes to strip the comment from the line
	const rc = '("|\'|/\\*|' + prefixes.join('|') + ')';
	commentEtcPrefixes = new RegExp(rc, 'g');

	// Prefixes to find the comment while hovering
	//const rh = '^(\\s*)(' + prefixes.join('|') + ')(.*)';
	const rh = '^(.*?)(' + prefixes.join('|') + ')(.*)';
	commentHoverPrefixes = new RegExp(rh, 'i');
	const rhs = '(' + prefixes.join('|') + ')';
	commentHoverPrefixesSameLine = new RegExp(rhs, 'i');
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
		while ((match = commentEtcPrefixes.exec(line))) {
			const j1 = match.index;
			// Which opening
			const opening = match[1];
			if (opening === '"' || opening === "'") {
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
			else if (opening === '/*') {
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


/**
 * Reads the lines above the given lineNr.
 * If it is commentary text it is returned otherwise undefined is returned.
 * The function can read commentary text with ',', '//', the custom prefix or /*.
 * If there is a single line comment on the current line this is used instead.
 * Furthermore, if the line contains an 'equ' without a comment. The complete
 * line is returned in order to see the contents of the equ while hovering.
 * @param lines The complete text file.
 * @param lineNr The lines above (<) lineNr are searched.
 * @returns An array with comments or an empty array if nothing found.
 */
export function readCommentsForLine(lines: string[], lineNr: number): string[] {
	// Safety check
	if (lines.length == 0 || lineNr < 0 || lineNr >= lines.length)
		return [];

	const hoverTexts: string[] = [];
	const text = lines[lineNr];
	// Check for match on line
	const commentFound = commentHoverPrefixesSameLine.test(text);
	if (commentFound || text.toLowerCase().indexOf('equ') >= 0)
		hoverTexts.unshift(text);
	// Check match on previous line
	let startLine = lineNr - 1;
	if (startLine >= 0) {
		const firstPrevLine = lines[startLine];
		// Check if it starts with single */ or with a single line comment
		let i = firstPrevLine.indexOf('*/');
		if (i < 0)
			i = Number.MAX_SAFE_INTEGER;
		const firstPrevMatch = commentHoverPrefixes.exec(firstPrevLine);
		let j = Number.MAX_SAFE_INTEGER;
		if (firstPrevMatch) {
			j = firstPrevMatch[1].length;
		}
		if (i != j) {
			// If both numbers would be equal, both would point to MAX_SAFE_INTEGER.
			// i.e. no comment was found.

			// Now check which one to use:
			if (j < i) {
				// Single line comment was first
				hoverTexts.unshift(firstPrevMatch![3]);
				startLine--;
				while (startLine >= 0) {
					// Check if line starts with ";" etc.
					const line = lines[startLine];
					const match = commentHoverPrefixes.exec(line);
					if (!match)
						break;
					// Add text
					hoverTexts.unshift(match[3]);
					// Next
					startLine--;
				}
			}
			else {
				// Multiline comment (*/) was first.
				// Get text before the */
				let firstLine = firstPrevLine.substring(0, i);
				firstLine = firstLine.trimEnd();
				if(firstLine)	// Add if not empty
					hoverTexts.unshift(firstLine);
				// Now loop all previous lines until /* is found
				startLine--;
				while (startLine >= 0) {
					// Check if line starts with ";" etc.
					const line = lines[startLine];
					let ip = line.indexOf('/*');
					if (ip >= 0) {
						// This is not foolproof: If there would be another /* in a line before the found /* it would be incorrect.
						let lastLine = line.substring(ip+2);
						lastLine = lastLine.trimEnd();
						if(lastLine)
							hoverTexts.unshift(lastLine);
						break;
					}

					// Add text
					hoverTexts.unshift(line);
					// Next
					startLine--;
				}
			}
		}
	}

	return hoverTexts;
}
