import {readFileSync} from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import {GlobalStorage} from '../globalstorage';
import {PackageInfo} from '../whatsnew/packageinfo';
import {DonateInfoInner} from './donateinfoinner';


/**
 * This class collects donation specific functions
 * like showing a nag screen or showing teh webview.
 */
export class DonateInfo extends DonateInfoInner {

	// Global storage properties
	protected static VERSION_ID = 'version';
	protected static DONATE_TIME_ID = 'donateTimeId';


	/**
	 * Returns the previous version, normally from GlobalStorage
	 * but here in a function to override for the unit tests.
	 * @returns E.g. "2.3.5"
	 */
	protected static getPreviousVersion(): string {
		const previousVersion = GlobalStorage.Get<string>(this.VERSION_ID)!;
		return previousVersion;
	}


	/**
	 * Returns the current version, normally from PackageInfo
	 * but here in a function to override for the unit tests.
	 * @returns E.g. "2.3.5"
	 */
	protected static getCurrentVersion(): string {
		const currentVersion = PackageInfo.extension.packageJSON.version;
		return currentVersion;
	}


	/**
	 * @returns The donation time. Normally from GlobalStorage but also used by unit tests.
	 */
	protected static getDonationTime(): number | undefined {
		const donateEndTime = GlobalStorage.Get<number>(this.DONATE_TIME_ID);
		return donateEndTime;
	}


	/**
	 * Sets the donation time until when the nag screen will be shown.
	 * Should be 14 days into the future after new version ahs been installed.
	 * @param time After this time the nag screen is not shown anymore. E.g .Date.now() + 14 days.
	 */
	protected static setDonationTime(time: number | undefined) {
		GlobalStorage.Set(this.DONATE_TIME_ID, time);
	}


	/**
	 * @returns Returns the state of the 'donated' flag in the asm-code-lens preferences.
	 */
	protected static getDonatedPref(): boolean {
		// Get donated state
		const configuration = PackageInfo.getConfiguration();
		const donated = configuration.get<boolean>('donated');
		if (donated)
			return true;
		return false;
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

}
