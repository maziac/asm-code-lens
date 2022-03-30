import {readFileSync} from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import {GlobalStorage} from './globalstorage';
import {PackageInfo} from './whatsnew/packageinfo';


export class DonateInfo {
	// Will be set to false if the donate info was shown once.
	protected static evaluateDonateTime = true;

	// The time until when the donation info will be shown
	protected static donateTime: number|undefined = undefined;

	// Global storage properties
	protected static VERSION_ID = 'version';
	protected static DONATE_TIME_ID = 'donateTimeId';

	// 2 weeks in ms
	protected static TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;


	/**
	 * Checks the version number.
	 * If a new (different) version has been installed the DONATE_TIME_ID is set to undefined.
	 * (To start a new timing.)
	 */
	public static checkVersion() {
		// Load data from extension storage
		const previousVersion = GlobalStorage.Get<string>(this.VERSION_ID)!;
		const currentVersion = PackageInfo.extension.packageJSON.version;

		// Check if version changed: "major", "minor" and "patch"
		if (currentVersion != previousVersion) {
			// Yes, remove the previous donate time
			GlobalStorage.Set(this.DONATE_TIME_ID, undefined);
			this.donateTime = undefined;
		}
	}


	public static async checkDonateInfo() {
		// Check if enabled
		if (this.evaluateDonateTime) {
			// Stop evaluating. Evaluate only once per activation.
			this.evaluateDonateTime = false;
			// Check if time already set
			if (this.donateTime == undefined) {
				this.donateTime = GlobalStorage.Get<number>(this.DONATE_TIME_ID);
				if (this.donateTime == undefined) {
					this.donateTime = Date.now() + this.TWO_WEEKS;
					GlobalStorage.Set(this.DONATE_TIME_ID, this.donateTime);
				}
			}
			if (Date.now() < this.donateTime) {
				// Time not elapsed yet.
				// Show info
				const selected = await vscode.window.showWarningMessage("ASM Code Lens: If you use 'ASM Code Lens' regularly please support the project.", "Not now", "Yes, please");
				if (selected?.toLowerCase().startsWith('yes')) {
					// Re-direct to donation page
					this.openDonateWebView();
				}
			}
		}
	}


	/**
	 * Opens a webview with donation information.
	 */
	protected static openDonateWebView() {
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
