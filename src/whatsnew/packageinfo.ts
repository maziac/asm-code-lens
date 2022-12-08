import * as vscode from 'vscode';


/**
 * Reads the package.json of the extension.
 */
export class PackageInfo {

	// The extension info is stored here after setting the extensionPath.
	public static extension: vscode.Extension<any>;


	/**
	 * Sets the extension path.
	 * Called on extension activation.
	 */
	public static Init(context: vscode.ExtensionContext) {
		// Store extension info
		this.extension = context.extension;
	}


	/**
	 * Convenience method to return the configuration/the settings.
	 * @param workspaceFolder The workspace folder to get the configuration for
	 * (in case of multiroot)
	 */
	public static getConfiguration(workspaceFolder?: vscode.WorkspaceFolder): vscode.WorkspaceConfiguration {
		const packageJSON = this.extension.packageJSON;
		const extensionBaseName = packageJSON.name;
		const config = vscode.workspace.getConfiguration(extensionBaseName, workspaceFolder);
		return config;
	}
}

