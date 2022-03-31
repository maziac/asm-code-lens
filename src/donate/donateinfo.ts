import {readFileSync} from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import {PackageInfo} from '../whatsnew/packageinfo';
import {DonateInfoInner} from './donateinfoinner';


/**
 * This class collects donation specific functions
 * like showing a nag screen or showing teh webview.
 */
export class DonateInfo extends DonateInfoInner {
	// Will be set to false if the donate info was shown once.
	protected static evaluateDonateTime: number | undefined = undefined;

	// The time until when the donation info will be shown
	protected static donateEndTime: number | undefined = undefined;

	// Global storage properties
	protected static VERSION_ID = 'version';
	protected static DONATE_TIME_ID = 'donateTimeId';


	/**
	 * Opens a webview with donation information.
	 */
	public static openDonateWebView() {
		// Create vscode panel view
		const vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine});
		vscodePanel.title = 'Donate...';
		// Read the file
		const extPath = PackageInfo.extension.extensionPath;
		const htmlFile = path.join(extPath, 'html/donate.html');
		let html = readFileSync(htmlFile).toString();
		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = vscodePanel.webview.asWebviewUri(resourcePath).toString();
		html = html.replace('${vscodeResPath}', vscodeResPath);

		// Handle messages from the webview
		vscodePanel.webview.options = {enableScripts: true};
		vscodePanel.webview.onDidReceiveMessage(message => {
			switch (message.command) {	// NOSONAR
				case 'showExtension':
					// Switch to Extension Manager
					vscode.commands.executeCommand("workbench.extensions.search", PackageInfo.extension.packageJSON.publisher)
					// And select the given extension
					const extensionName = PackageInfo.extension.packageJSON.publisher + '.' + message.data;
					vscode.commands.executeCommand("extension.open", extensionName);
					break;
			}
		});

		// Set html
		vscodePanel.webview.html = html;
	}

}
