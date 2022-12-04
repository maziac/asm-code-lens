import * as vscode from 'vscode';
import {PackageInfo} from "./whatsnew/packageinfo";


 /**
  * Used to pass user preferences settings between functions.
  */
export class Config {
	// A map with the configs for all workspace folders
	public static configs = new Map<string, Config>();

	// The root folder of the workspace
	public wsFolderPath: string;

	// true if labels with colons should be searched.
	public labelsWithColons: boolean;

	// true if code lenses should be enabled.
	public enableCodeLenses: boolean;

	// true if code lenses should be enabled.
	public enableHovering: boolean;

	// true if code lenses should be enabled.
	public enableCompletions: boolean;

	// true if code lenses should be enabled.
	public enableGotoDefinition: boolean;

	// true if code lenses should be enabled.
	public enableFindAllReferences: boolean;

	// true if code lenses should be enabled.
	public enableRenaming: boolean;

	// true if code lenses should be enabled.
	public enableOutlineView: boolean;

	//  true if labels without colons should be searched.
	public labelsWithoutColons: boolean;


	// A list of strings with words to exclude from the found labels list.
	public labelsExcludes: string[];


	/** Loops through all workspace folders and gets there configuration.
	 */
	public static init() {
		const workspaceFolders = vscode.workspace.workspaceFolders || [];
		for (const workspaceFolder of workspaceFolders) {
			// Create a new config instance
			const config = new Config();
			// Get settings for folder.
			const fsPath = workspaceFolder.uri.fsPath;
			config.wsFolderPath = fsPath;
			const settings = PackageInfo.getConfiguration(workspaceFolder);
			config.labelsWithColons = true;
			config.labelsWithoutColons = true;
			const labelsColon = (settings.get<string>('labels.colon') || '').toLowerCase();	// TODO: simpler access, eg. settings.labels.colon
			if (labelsColon.startsWith('without '))
				config.labelsWithColons = false;
			else if (labelsColon.startsWith('with '))
				config.labelsWithoutColons = false;
			const labelsExcludesString = settings.get<string>('labels.excludes') || '';
			config.labelsExcludes = labelsExcludesString.toLowerCase().split(';');
			config.enableCodeLenses = settings.enableCodeLenses;
			config.enableHovering = settings.enableHovering;
			config.enableCompletions = settings.enableCompletions;
			config.enableGotoDefinition = settings.enableGotoDefinition;
			config.enableFindAllReferences = settings.enableFindAllReferences;
			config.enableRenaming = settings.enableRenaming;
			config.enableOutlineView = settings.enableOutlineView;
			// Store
			Config.configs.set(fsPath, config);
		}
	}


	/** Returns a config for a workspace folder path.
	 * @param wsFolderPath The workspace folder path.
	 * @returns The correspondent config or undefined.
	 */
	public static getConfig(wsFolderPath: string) { // TODO: Really required?
		return Config.configs.get(wsFolderPath);
	}


	/** Returns a config for a text document.
	 * @param document The TextDocument.
	 * @returns The correspondent config or undefined for the workspace folder the
	 * TextDocument resides in.
	 */
	public static getConfigForDoc(document: vscode.TextDocument) {
		if (!document)
			return undefined;
		const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
		if (!workspaceFolder)
			return undefined;
		return Config.configs.get(workspaceFolder.uri.fsPath);
	}
}
