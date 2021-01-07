import * as vscode from 'vscode';
import * as semver from 'semver';
import * as path from 'path';
import {readFileSync} from 'fs';


export class WhatsNew {
	// The extension name.
	protected static extensionName = "maziac.asm-code-lens";

	/// A panel (containing the webview).
	protected vscodePanel: vscode.WebviewPanel;


	/**
	 * Updates the version number.
	 * @param context The extension context.
	 * @return true if version was updated. false if version major/monr are equal.
	 */
	public static updateVersion(context: vscode.ExtensionContext): boolean {
		// Load data from extension manifest
		const extension = vscode.extensions.getExtension(WhatsNew.extensionName)!;

		const versionId = WhatsNew.extensionName + '.version';
		const previousExtensionVersion = context.globalState.get<string>(versionId)!;
		const currentVersion = extension.packageJSON.version;
		if (previousExtensionVersion) {
			const differs: semver.ReleaseType | null = semver.diff(currentVersion, previousExtensionVersion);

			// Only "patch" should be suppressed
			if (!differs || differs === "patch") {
				return true; // TODO: Remove
				//return false;	// Versions do not differ
			}
		}

		// Update version: "major", "minor"
		context.globalState.update(versionId, currentVersion);

		// Versions differ
		return true;
	}


	/**
	 * Creates the text view.
	 * @param title The title to use for this view.
	 * @param text The static text to show.
	 */
	constructor() {
		// Create vscode panel view
		this.vscodePanel = vscode.window.createWebviewPanel('', '', {preserveFocus: true, viewColumn: vscode.ViewColumn.Nine});

		// Title
		this.vscodePanel.title = "Whats New";

		// Init html
		this.setHtml();
	}


	/**
	 * Returns the html code to display the whats web html.
	 */
	public setHtml() {
		if (!this.vscodePanel.webview)
			return;
		// Add the html styles etc.
		const extension = vscode.extensions.getExtension(WhatsNew.extensionName)!;
		const extPath = extension.extensionPath;
		const mainHtmlFile = path.join(extPath, 'html/whatsnew.html');
		let html = readFileSync(mainHtmlFile).toString();

		// Exchange local path
		const resourcePath = vscode.Uri.file(extPath);
		const vscodeResPath = this.vscodePanel.webview.asWebviewUri(resourcePath).toString();
		html = html.replace('${vscodeResPath}', vscodeResPath);

		// Exchange extension name
		html = html.replace(/\${extensionName}/g, WhatsNew.extensionName);

		// Exchange extension name
		html = html.replace(/\${extensionVersion}/g, extension.packageJSON.version);

		// Exchange display name
		html = html.replace(/\${extensionDisplayName}/g, extension.packageJSON.displayName);

		// Exchange repository
		html = html.replace(/\${repositoryUrl}/g, extension.packageJSON.repository.url);

		// Exchange repository
		html = html.replace(/\${repositoryIssues}/g, extension.packageJSON.bugs.url);

		// Exchange repository
		html = html.replace(/\${repositoryHomepage}/g, extension.packageJSON.repository.url);

		// Exchange changelog
		const changeLogFile = path.join(extPath, 'html/whatsnew_changelog.html');
		const changeLogHtml = readFileSync(changeLogFile).toString();
		html = html.replace('${changeLog}', changeLogHtml);

		// Set content
		this.vscodePanel.webview.html = html;
	}



}
