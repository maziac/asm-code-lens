// export = ; at the top is required to get rid of
// Object.defineProperty(exports, "__esModule", {value: true});
// at the top of the transpiled js file.
// Otherwise global variables do not work.
// See here https://github.com/microsoft/TypeScript/issues/14351
export = 0;


declare let acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

/**
 * Send message to show the extensions.
 */
function showExtension(extensionName: string) {
	vscode.postMessage({
		command: 'showExtension',
		data: extensionName
	});
}
