import * as vscode from 'vscode';
import {Config} from './config';
import {CommonRegexes} from './regexes/commonregexes';
import {FoldingRegexes} from './regexes/foldingregexes';
import {stripAllComments} from './comments';



/** The folding Provider.
 * Only for asm files not for list files.
 */
export class FoldingProvider implements vscode.FoldingRangeProvider {

	/** Returns a list of folding ranges or null and undefined if the provider
	 * does not want to participate or was cancelled.
	 * Is available only for asm files, not list files.
	 * Note: It seems that the folding range provider is called 3 times with the
	 * same document for every document change.
	 * @param document The document in which the command was invoked.
	 * @param context Additional context information (for future use)
	 * @param token A cancellation token.
	 */
	provideFoldingRanges(document: vscode.TextDocument, _context: vscode.FoldingContext, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {
		// Check which workspace
		const config = Config.getConfigForDoc(document);
		//console.log("folding:", config?.enableFolding, document.uri.fsPath);
		if (!config?.enableFolding)
			return [];   // Don't show any hover.

		// Read doc
		const linesData = document.getText();
		const lines = linesData.split('\n');
		const foldingRanges: vscode.FoldingRange[] = [];

		// Prepare regexes
		const regexLabel = CommonRegexes.regexLabel(config, 'asm-collection');
		const regexCommentMultipleStart = FoldingRegexes.regexCommentMultipleStart();
		const regexCommentMultipleEnd = FoldingRegexes.regexCommentMultipleEnd();
		const regexCommentSingle = FoldingRegexes.regexCommentSingleLine(Config.globalToggleCommentPrefix);

		// State base parsing
		let rangeLineNrStart = -1;
		let state: string | undefined;
		const len = lines.length;
		for (let lineNr = 0; lineNr < len; lineNr++) {
			const line = lines[lineNr];

			switch (state) {
				case '/*':
					// Check for multiline comment end.
					if (regexCommentMultipleEnd.exec(line)) {
						this.addRange(foldingRanges, rangeLineNrStart, lineNr, vscode.FoldingRangeKind.Comment);
						state = undefined;
					}
					break;

				case ';':
					// Check for single comment end.
					if (!regexCommentSingle.exec(line)) {
						lineNr--;	// Recheck line
						this.addRange(foldingRanges, rangeLineNrStart, lineNr, vscode.FoldingRangeKind.Comment);
						state = undefined;
					}
					break;

				case 'label':
				default: {
					// Find label, comment etc.
					let nextState: string | undefined;
					if (regexLabel.exec(line))
						nextState = 'label';
					else if (regexCommentSingle.exec(line))
						nextState = ';';
					else if (regexCommentMultipleStart.exec(line))
						nextState = '/*';
					if (nextState) {
						// Check if a previous range ends
						if (state === 'label') {
							this.addRange(foldingRanges, rangeLineNrStart, lineNr - 1, vscode.FoldingRangeKind.Region);
						}
						// Start a new folding marker
						rangeLineNrStart = lineNr;
						state = nextState;
					}
					break;
				}
			}
		}

		// Close last range
		if(state) {
			const kind = (state === 'label') ? vscode.FoldingRangeKind.Region : vscode.FoldingRangeKind.Comment;
			this.addRange(foldingRanges, rangeLineNrStart, len - 1, kind);
		}

		// Now add overarching regions (modules, structs, macros)
		stripAllComments(lines);

		// Add ranges for MODULEs
		this.addRangesForRegex(lines, foldingRanges, FoldingRegexes.regexModuleStart(), FoldingRegexes.regexModuleEnd());

		// Add ranges for STRUCTs
		this.addRangesForRegex(lines, foldingRanges, FoldingRegexes.regexStructStart(), FoldingRegexes.regexStructEnd());

		// Add ranges for MACROs
		this.addRangesForRegex(lines, foldingRanges, FoldingRegexes.regexMacroStart(), FoldingRegexes.regexMacroEnd());

		return foldingRanges;
	}


	/** Adds a new range if lineEnd is bigger than lineStart.
	 * @param foldingRanges An array of already known folding ranges, the new range is added to it.
	 * @param lineStart The range start.
	 * @param lineEnd The range end.
	 * @param kind 'Comment' or 'Region'.
	 */
	protected addRange(foldingRanges: vscode.FoldingRange[], lineStart: number, lineEnd: number, kind: vscode.FoldingRangeKind) {
		if (lineEnd > lineStart) {
			const range = new vscode.FoldingRange(lineStart, lineEnd, kind);
			foldingRanges.push(range);
		}
	}


	/** Adds overarching ranges, e.g. for MODULE/ENDMODULE, STRUCT/ENDS and MACRO/ENDM.
	 * @param lines The text lines to search (comments have been stripped already)
	 * @param foldingRanges An array of already known folding ranges, the new ranges are added to it.
	 * @param regexStart E.g. /..MODULE.../
	 * @param regexEnd E.g. /..ENDMODULE.../
	 */
	protected addRangesForRegex(lines: string[], foldingRanges: vscode.FoldingRange[], regexStart: RegExp, regexEnd: RegExp) {
		let ranges: vscode.FoldingRange[] = [];
		let lineNr = -1;
		const lastLineNr = lines.length - 1;
		for (const line of lines) {
			lineNr++;
			// Check for range start
			if (regexStart.exec(line)) {
				// Create range object
				const range = new vscode.FoldingRange(lineNr, lastLineNr, vscode.FoldingRangeKind.Region);
				ranges.push(range)
				// Add already
				foldingRanges.push(range);
			}
			// Check for range end
			else if (regexEnd.exec(line)) {
				const range = ranges.pop();
				if (range) {
					range.end = lineNr;
				}
			}
		}
	}

}
