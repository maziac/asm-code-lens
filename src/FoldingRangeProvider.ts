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
		// Strip comments
		stripAllComments(lines);

		// Search label
		const regexLabels = CommonRegexes.regexesLabel(config, 'asm-collection');
		let currentRange: vscode.FoldingRange | undefined;
		let foldingRanges: vscode.FoldingRange[] = [];
		let lineNr = -1;
		for (const line of lines) {
			lineNr++;
			for (const regexLabel of regexLabels) {
				// Check if line starts with a (non-local) label
				const match = regexLabel.exec(line);
				if (match) {
					// Check for range start or end?
					if (currentRange) {
						// End of range
						currentRange.end = lineNr - 1;
						foldingRanges.push(currentRange);
					}
					// End of range is always also the start of of a range
					currentRange = new vscode.FoldingRange(lineNr, 0, vscode.FoldingRangeKind.Region);
					break;	// One match is enough
				}
			}
		}
		// Close any opened folding range
		if (currentRange) {
			currentRange.end = lineNr - 1;
			foldingRanges.push(currentRange);
		}

		return foldingRanges;
	}
}
