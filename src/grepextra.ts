
/**
 * Some grep.ts functions are moved into this separate file to
 * make them available to unit tests.
 */

import {CommonRegexes} from "./regexes/commonregexes";



/**
 * Structure used to cache the file module and struct info.
 */
export interface FileModuleStructInfo {
	/// The line number:
	row: number,
	/// The label (module, struct label) that is valid from that line on.
	label: string,
}


/**
 * Structure used to cache the file as a string array and additionally
 * the module and struct info.
 */
export interface FileInfo {
	// The file as string array.
	lines: string[],
	// The entries with the module/struct info
	modStructInfos: FileModuleStructInfo[]
}


/**
 * Turns the file into an array of FileModuleStructInfo.
 * I.e. all MODULE OR STRUCT occurrences are scanned and the start
 * and end of the structures are put into the array (row and label name).
 * @param fileName The filename of the document.
 * @returns FileModuleStructInfo[]
 */
export function getModuleFileInfo(lines: string[]): FileModuleStructInfo[] {
	// The  complete document is parsed 'MODULE' and 'STRUCT' info.
	const regexModule = CommonRegexes.regexModuleStruct();
	const regexEndmodule = CommonRegexes.regexEndModuleStruct();
	const modules: Array<string> = [];
	const len = lines.length;
	const fileInfo: FileModuleStructInfo[] = [];
	for (let row = 0; row < len; row++) {
		const lineContents = lines[row];

		// MODULE, STRUCT
		const matchModule = regexModule.exec(lineContents);
		const matchEndmodule = regexEndmodule.exec(lineContents);
		if (matchModule) {
			modules.push(matchModule[2]);
		}
		// ENDMODULE, ENDSTRUCT
		else if (matchEndmodule) {
			modules.pop();
		}
		else {
			continue;
		}

		// If either of both regexes is found:
		// Add to file info
		const label = modules.join('.');
		fileInfo.push({
			row,
			label
		});
	}

	return fileInfo;
}


/**
 * Returns the complete label around the 'startIndex'.
 * I.e. startIndex might point to the last part of the label then this
 * function returns the complete label.
 * @param lineContents The text of the line.
 * @param startIndex The index into the label.
 * @param regexEnd Defaults to /[\w\.]/ . I.e. the label is returned with all subparts.
 * Note: The HoverProvider might use /\w/ so that the sub parts are not returned.
 * @returns {label, preString} The found label and the part of the string that
 * is found before 'label'.
 */
export function getCompleteLabel(lineContents: string, startIndex: number, regexEnd = /[\w.]/): {label: string, preString: string} {
	// Find end of label.
	const len = lineContents.length;    // REMARK: This can lead to error: "length of undefined"
	let k: number;
	for (k = startIndex; k < len; k++) {
		const s = lineContents.charAt(k);
		// Allow [a-z0-9_]
		const match = regexEnd.exec(s);
		if (!match)
			break;
	}
	// k points now after the label

	// Find start of label.
	let i;
	for (i = startIndex - 1; i >= 0; i--) {
		const s = lineContents.charAt(i);
		// Allow [a-z0-9_.]
		const match = /[\w.]/.exec(s);
		if (!match)
			break;
	}
	// i points one before the start of the label
	i++;

	// Get complete string
	const label = lineContents.substring(i, k);
	const preString = lineContents.substring(0, i);

	return {label, preString};
}


/**
 * Searches 'lines' from 'index' to 0 and returns the
 * first non local label.
 * @param regexLbls Regexes to find labels. A different regex depending on asm or list file and colons used or not.
 * @param lines An array of strings containing the complete text.
 * @param index The starting line (the line where the label was found.
 * @returns A string like 'check_collision'. undefined if nothing found.
 */
export function getNonLocalLabel(regexLbls: RegExp, lines: Array<string>, index: number): string {
	// Loop
	let match;
	for (; index >= 0; index--) {
		const line = lines[index];
		match = regexLbls.exec(line);
		if (match) {
			const label = match[2];
			return label;
		}
	}

	// Out of bounds check
	return undefined as any;
}


/**
 * Concatenates a module and a label.
 * @param module E.g. 'sound.effects'.
 * @param label  E.g. 'explosion'
 * @return E.g. sound.effects.explosion. If module is undefined or an empty string then label is returned unchanged.
 */
export function concatenateModuleAndLabel(module: string, label: string): string {
	if (!module)
		return label;
	if (module.length == 0)
		return label;

	const mLabel = module + '.' + label;
	return mLabel;
}


/**
 * Returns the label and the module label (i.e. module name + label) for a given
 * file and position.
 * The file is given as a string array (lines).
 * 1. The original label is constructed from the row and clmn info.
 * 2. If local label: The document is parsed from position to begin for a non-local label.
 * 3. The fileInfo is used to get the full label with MODULE and/or STRUCT info.
 * 4. The MODULE info is added to the original label (this is now the searchLabel).
 * 4. Both are returned.
 * @param regexLbls Regexes to find labels. A different regex depending on asm or list file and colons used or not.
 * @param fileInfo The cached file.
 * @param row The line position that points to the label.
 * @param clmn The column position that points to the label.
 * @returns { label, moduleLabel }
 */
export function getLabelAndModuleLabelFromFileInfo(regexLbls: RegExp, fileInfo: FileInfo, row: number, clmn: number, regexEnd = /[\w.]/): {label: string, moduleLabel: string} {
	// 1. Get original label
	const lines = fileInfo.lines;
	const line = lines[row];
	let {label, preString} = getCompleteLabel(line, clmn, regexEnd);

	// If local label: The document is parsed from position to begin for a non-local label.
	if (label.startsWith('.')) {
		// Local label, e.g. ".loop"
		const nonLocalLabel = getNonLocalLabel(regexLbls, lines, row);
		if (nonLocalLabel)
			label = nonLocalLabel + label;
	}

	// Now parse file info for the module/struct part of a label
	let moduleStructParentLabel;
	for (const item of fileInfo.modStructInfos) {
		if (item.row > row)
			break;
		moduleStructParentLabel = item.label;
	}

	// The MODULE info is added to the original label
	const moduleLabel = concatenateModuleAndLabel(moduleStructParentLabel, label);

	// Check that no character is preceding the label or label ends with ':' (for list files)
	const k = preString.length + label.length;
	if (preString.length == 0 || line[k] == ':') {
		// It's the definition of a label, so moduleLabel is the only possible label.
		label = moduleLabel;
	}

	return {label, moduleLabel};
}

