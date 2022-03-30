import {readFileSync} from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import {GlobalStorage} from './globalstorage';
import {PackageInfo} from './whatsnew/packageinfo';


export class DonateInfo {
	// Will be set to false if the donate info was shown once.
	protected static evaluateDonateTime: number | undefined = undefined;

	// The time until when the donation info will be shown
	protected static donateEndTime: number | undefined = undefined;

	// Global storage properties
	protected static VERSION_ID = 'version';
	protected static DONATE_TIME_ID = 'donateTimeId';


	/**
	 * Checks the version number.
	 * If a new (different) version has been installed the DONATE_TIME_ID is set to undefined.
	 * (To start a new timing.)
	 * Is called at the start of the extension (before checkDonateInfo).
	 */
	public static checkVersion() {
		// Load data from extension storage
		const previousVersion = GlobalStorage.Get<string>(this.VERSION_ID)!;
		const currentVersion = PackageInfo.extension.packageJSON.version;

		// Check if version changed: "major", "minor" and "patch"
		if (currentVersion != previousVersion) {
			// Yes, remove the previous donate time
			GlobalStorage.Set(this.DONATE_TIME_ID, undefined);
		}

		// Check if already donated
		const configuration = PackageInfo.getConfiguration();
		const donated = configuration.get<boolean>('donated');
		if (!donated) {
			// Start evaluation
			this.evaluateDonateTime = Date.now();
		}
	}


	public static async checkDonateInfo() {
		// Check if enabled
		if (this.evaluateDonateTime != undefined &&
			Date.now() > this.evaluateDonateTime) {
			// Evaluate only once per day or activation.
			this.evaluateDonateTime = Date.now() + this.daysInMs(1/24/60/2);
			// Check if time already set
			if (this.donateEndTime == undefined) {
				this.donateEndTime = GlobalStorage.Get<number>(this.DONATE_TIME_ID);
				if (this.donateEndTime == undefined) {
					this.donateEndTime = Date.now() + this.daysInMs(14);
					GlobalStorage.Set(this.DONATE_TIME_ID, this.donateEndTime);
				}
			}
			if (Date.now() < this.donateEndTime) {
				// Time not elapsed yet.
				// Show info as error text (warning and info text goes away by itself after a short timeout)
				const selected = await vscode.window.showErrorMessage("If you use 'ASM Code Lens' regularly please support the project. Every little donation helps keeping the project running.", "Not now", "Yes, please. I want to show my support.");
				if (selected?.toLowerCase().startsWith('yes')) {
					// Re-direct to donation page
					this.openDonateWebView();
				}
			}
			else {
				// Stop evaluating.
				this.evaluateDonateTime = undefined;
			}
		}
	}


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


	/**
	 * Returns the number of days in ms.
	 */
	protected static daysInMs(days: number) {
		return days * 24 * 60 * 60 * 1000;
	}
}
