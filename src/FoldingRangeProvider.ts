import * as vscode from 'vscode';
import {stripAllComments} from './comments';
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

/*
		// State base parsing
		let currentRange: vscode.FoldingRange | undefined;
		let lineNr = -1;
		let state: string | undefined;
		let lastIndex = 0;
		for (const line of lines) {
			lineNr++;

			// Check for any start
			for (const regexStart of regexesStart) {
				// Check if line starts with a (non-local) label
				const match = regexStart.exec(line);
				if (match) {
					// End of range is always also the start of of a range
					currentRange = new vscode.FoldingRange(lineNr, 0, kind);
					break;	// One match is enough
				}
			}

			switch (state) {
				case '/*':

					break;

				case ';':

					break;

				case 'label':

					break;

				case 'macro':

					break;

				case 'module':

					break;

				default:
					break;
			}


		}
		// Close any opened folding range
		if (currentRange) {
			currentRange.end = lineNr - 1;
			if (currentRange.start !== currentRange.end)
				foldingRanges.push(currentRange);
		}
		*/

		// Search comments /* */
		 this.parseLines(foldingRanges, lines, vscode.FoldingRangeKind.Comment, [/^\s*\/\*/], [/\*\//]);
		// // Search comments ;
		// this.parseLines(foldingRanges, lines, vscode.FoldingRangeKind.Comment, [/^;/], [/^[^;]/, /^\s*$/], -1);


		// // Strip comments
		// stripAllComments(lines);

		// // Search (non-local) label
		// const regexLabels = CommonRegexes.regexesLabel(config, 'asm-collection');
		// this.parseLines(foldingRanges, lines, vscode.FoldingRangeKind.Region, regexLabels, regexLabels, -1);


		return foldingRanges;
	}


	/** Parses all lines for regexes.
	 * All are toplevel folding. There are no sub-foldings.
	 * When a
	 */
	protected parseLines(foldingRanges: vscode.FoldingRange[], lines: string[], kind: vscode.FoldingRangeKind, regexesStart: RegExp[], regexesEnd: RegExp[], endOffset = 0) {
		let currentRange: vscode.FoldingRange | undefined;
		let lineNr = -1;
		let lastIndex = 0;
		for (const line of lines) {
			lineNr++;
			// Check for end
			if (currentRange) {
				// First check if another folding range already starts here (would ed the current range)
				const len = foldingRanges.length;
				for (; lastIndex < len; lastIndex++) {  //macht nur sinn für die Commentare. Das Array sollte ich also übergeben, oder zumindest den array index
					const range = foldingRanges[lastIndex];
					if (lineNr === range.start) {
						// This ends the current range
						currentRange.end = lineNr;
						if (currentRange.start !== currentRange.end)
							foldingRanges.push(currentRange);
						currentRange = undefined;
						break;
					}
				}
				if (currentRange === undefined)
					continue;	// Skip finding the start for this line (there is already one)
				// Check for end regex
				for (const regexEnd of regexesEnd) {
					// Check if line starts with a (non-local) label
					const match = regexEnd.exec(line);
					if (match) {
						// End of range
						currentRange.end = lineNr + endOffset;
						if(currentRange.start !== currentRange.end)
							foldingRanges.push(currentRange);
						currentRange = undefined;
						break;	// One match is enough
					}
				}
				if (currentRange === undefined && endOffset === 0)
					continue;	// Skip finding the start for this line
			}

			// Check for start
			if (regexesStart === regexesEnd || !currentRange) {
				for (const regexStart of regexesStart) {
					// Check if line starts with a (non-local) label
					const match = regexStart.exec(line);
					if (match) {
						// End of range is always also the start of of a range
						currentRange = new vscode.FoldingRange(lineNr, 0, kind);
						break;	// One match is enough
					}
				}
			}
		}
		// Close any opened folding range
		if (currentRange) {
			currentRange.end = lineNr - 1;
			if (currentRange.start !== currentRange.end)
				foldingRanges.push(currentRange);
		}
	}
}
