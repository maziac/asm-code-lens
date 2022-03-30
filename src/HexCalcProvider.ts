import * as vscode from 'vscode';
import * as path from 'path';
import {readFileSync} from 'fs';
import {PackageInfo} from './whatsnew/packageinfo';
import {DonateInfo} from './donateinfo';


export class HexCalcProvider implements vscode.WebviewViewProvider {
	// The webview is stored here.
	protected webview: vscode.Webview;


	/**
	 * Called by vscode.
	 */
	resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
		// Store webview
		this.webview = webviewView.webview;

		// Allow scripts in the webview
		this.webview.options = {
			enableScripts: true
		};

		// Handle messages from the webview
		this.webview.onDidReceiveMessage(message => {
			switch (message.command) {	// NOSONAR
				case 'donateClicked':
					DonateInfo.openDonateWebView();
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
		const extPath = PackageInfo.extension.extensionPath;
		const mainHtmlFile = path.join(extPath, 'html', 'hexcalc.html');
		let mainHtml = readFileSync(mainHtmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.webview.asWebviewUri(resourcePath).toString();
		mainHtml = mainHtml.replace(/\${vscodeResPath}/g, vscodeResPath);

		// Get hex prefix
		const configuration = PackageInfo.getConfiguration();
		const hexPrefix = configuration.get<string>('hexCalculator.hexPrefix');
		// Add to initialization
		mainHtml = mainHtml.replace('//${init}', `
let hexPrefix = "${hexPrefix}";`
		);

		// Get donated state
		const donated = configuration.get<boolean>('donated');
		// Set button
		if (!donated) {
			mainHtml = mainHtml.replace('<!--${donate}-->', `
		<button class="button-donate" style="float:right" onclick="donateClicked()">Donate...<div style="float:right;font-size:50%">ASM Code Lens</div></button>`);
		}

		// Add a Reload and Copy button for debugging
		//mainHtml = mainHtml.replace('<body>', '<body><button onclick="parseStart()">Reload</button><button onclick="copyHtmlToClipboard()">Copy HTML to clipboard</button>');

		// Set content
		this.webview.html = mainHtml;
	}

}
