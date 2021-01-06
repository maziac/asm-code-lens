import * as vscode from 'vscode';
import * as path from 'path';
import {readFileSync} from 'fs';


export class HexCalcProvider implements vscode.WebviewViewProvider {
	// The webview is stored here.
	protected webview: vscode.Webview;

	/**
	 * Called by vscode.
	 */
	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		// Store webview
		this.webview = webviewView.webview;

		// Options
		this.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,
		};


		// Handle messages from the webview
		this.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'donateClicked':
					this.openDonateWebView();
					break;
			}
		});

		// Create html code
		this.setMainHtml();
	}


	/**
	 * Returns the html code to display the calculator.
	 */
	public setMainHtml() {
		if (!this.webview)
			return;
		// Add the html styles etc.
		const extPath = vscode.extensions.getExtension("maziac.asm-code-lens")!.extensionPath as string;
		const mainHtmlFile = path.join(extPath, 'html/main.html');
		let mainHtml = readFileSync(mainHtmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.webview.asWebviewUri(resourcePath).toString();
		mainHtml = mainHtml.replace('${vscodeResPath}', vscodeResPath);

		// Get hex prefix
		const configuration = vscode.workspace.getConfiguration('asm-code-lens');
		let hexPrefix = configuration.get<string>('hexCalculator.hexPrefix');
		// Add to initialization
		mainHtml = mainHtml.replace('//${init}', `
let hexPrefix = "${hexPrefix}";
`
		);

		// Get donated state
		const donated = configuration.get<boolean>('donated');
		// Set button
		if (!donated) {
			mainHtml = mainHtml.replace('<!--${donate}-->', `
		<button color="lightyellow" style="float:right;background-color:yellow" onclick="donateClicked()">Donate...</button>
					`);
		}

		// Add a Reload and Copy button for debugging
		//mainHtml = mainHtml.replace('<body>', '<body><button onclick="parseStart()">Reload</button><button onclick="copyHtmlToClipboard()">Copy HTML to clipboard</button>');

		// Set content
		this.webview.html = mainHtml;
	}


	/**
	 * Opens a webview with dontaion information.
	 */
	protected openDonateWebView() {
		// Create vscode panel view
		const vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine});
		// Read the file
		const extPath = vscode.extensions.getExtension("maziac.asm-code-lens")!.extensionPath as string;
		const htmlFile = path.join(extPath, 'html/donate.html');
		let html = readFileSync(htmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = vscodePanel.webview.asWebviewUri(resourcePath).toString();
		html = html.replace('${vscodeResPath}', vscodeResPath);
		// Set html
		vscodePanel.webview.html = html;
	}

}
