import {vscode} from './vscode-import';



/**
 * Send message to show the extensions.
 */
// @ts-ignore
globalThis.showExtension = function (extensionName: string) {
	vscode.postMessage({
		command: 'showExtension',
		data: extensionName
	});
}
