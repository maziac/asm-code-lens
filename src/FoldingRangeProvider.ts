import * as vscode from 'vscode';
import {Config} from './config';
import {CommonRegexes} from './regexes/commonregexes';



/** The folding Provider.
 * Only for asm files not for list files.
 */
export class FoldingProvider implements vscode.FoldingRangeProvider {

	/**
	 * An optional event to signal that the folding ranges from this provider have changed.
	 */
	//onDidChangeFoldingRanges?: Event<void>;


	/**
	 * Returns a list of folding ranges or null and undefined if the provider
	 * does not want to participate or was cancelled.
	 * @param document The document in which the command was invoked.
	 * @param context Additional context information (for future use)
	 * @param token A cancellation token.
	 */
	provideFoldingRanges(document: vscode.TextDocument, _context: vscode.FoldingContext, _token: vscode.CancellationToken): vscode.ProviderResult<vscode.FoldingRange[]> {     // Check which workspace
		const config = Config.getConfigForDoc(document);
		if (!config?.enableFolding) 	// TODO
			return undefined;   // Don't show any hover.

		// Read doc
		const linesData = document.getText();
		const lines = linesData.split('\n');
		const foldingRanges: vscode.FoldingRange[] = [];

		// Prepare regexes
		const regexLabel = CommonRegexes.regexLabel(config, 'asm-collection');
		const regexCommentMultipleStart = /^\/\*/;
		const regexCommentMultipleEnd = /\*\//;
		const regexCommentSingle = /^;/;
		/* TODO

	singleLineCommentsSet = new Set<string>([';', '//']);
	if (prefix)
		singleLineCommentsSet.add(prefix);
	const prefixes = Array.from(singleLineCommentsSet);
	*/

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
				default:
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

		// Close last range
		if(state) {
			const kind = (state === 'label') ? vscode.FoldingRangeKind.Region : vscode.FoldingRangeKind.Comment;
			this.addRange(foldingRanges, rangeLineNrStart, len - 1, kind);
		}

		return foldingRanges;
	}


	// TODO: Add comment
	protected addRange(foldingRanges: vscode.FoldingRange[], lineStart: number, lineEnd: number, kind: vscode.FoldingRangeKind) {
		if (lineEnd > lineStart) {
			const range = new vscode.FoldingRange(lineStart, lineEnd, kind);
			foldingRanges.push(range!);
		}
	}
}
