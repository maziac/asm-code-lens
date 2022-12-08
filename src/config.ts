import * as vscode from 'vscode';
import {PackageInfo} from "./whatsnew/packageinfo";


 /**
  * Used to pass user preferences settings between functions.
  * All configurations all all workspace folder are stored in 'configs'.
  * Each workspace folder can have own settings.
  *
  * However, there is only one provider registered at vscode for all workspaces.
  * This seems not fully implemented in vscode:
  * E.g. if folder A registers the goto definitions and the folder B doesn't,
  * then a definition provider has to be registered. I.e. a menu "Goto definition"
  * is also displayed in folder B.
  *
  * If a provider should be enabled is found in the 'enable...' instance variables.
  * All are ORed in the 'globalEnable...' static variables.
  * Via the global variables a provider is registered. I.e. if the 'GlobalEnable...'
  * is false the provider will not be registered at all.
  */
export class Config {
	// true if code lenses should be enabled.
	public static globalEnableCodeLenses: boolean;

	// true if code lenses should be enabled.
	public static globalEnableHovering: boolean;

	// true if code lenses should be enabled.
	public static globalEnableCompletions: boolean;

	// true if code lenses should be enabled.
	public static globalEnableGotoDefinition: boolean;

	// true if code lenses should be enabled.
	public static globalEnableFindAllReferences: boolean;

	// true if code lenses should be enabled.
	public static globalEnableRenaming: boolean;

	// true if code lenses should be enabled.
	public static globalEnableOutlineView: boolean;

	// The custom prefix to use for toggle line comment. Depends on language
	// id and can therefore only be set globally.
	public static globalToggleCommentPrefix: string;

	// A map with the configs for all workspace folders
	public static configs = new Map<string, Config>();


	// The root folder of the workspace
	public wsFolderPath: string;

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

	// true if labels with colons should be searched.
	public labelsWithColons: boolean;

	//  true if labels without colons should be searched.
	public labelsWithoutColons: boolean;

	// A list of strings with words to exclude from the found labels list.
	public labelsExcludes: string[];

	// Exclude files (glob pattern)
	public excludeFiles: string;

	// Required minimum length for completions.
	public completionsRequiredLength: number;


	/** Loops through all workspace folders and gets there configuration.
	 */
	public static init() {
		// Set global variables (variables with 'window' scope)
		const globalSettings = PackageInfo.getConfiguration();
		Config.globalToggleCommentPrefix = globalSettings.comments.toggleLineCommentPrefix;

		// Clear global/local variables (variables with 'resource' scope)
		Config.globalEnableCodeLenses = false;
		Config.globalEnableHovering = false;
		Config.globalEnableCompletions = false;
		Config.globalEnableGotoDefinition = false;
		Config.globalEnableFindAllReferences = false;
		Config.globalEnableRenaming = false;
		Config.globalEnableOutlineView = false;

		// Go through each setting
		const workspaceFolders = vscode.workspace.workspaceFolders || [];
		//console.log("# workspacefolders=" + workspaceFolders.length);
		for (const workspaceFolder of workspaceFolders) {
			// Create a new config instance
			const config = new Config();
			// Get settings for folder.
			const fsPath = workspaceFolder.uri.fsPath;
			//console.log("workspacefolder=" + fsPath);
			config.wsFolderPath = fsPath;
			const settings = PackageInfo.getConfiguration(workspaceFolder);
			config.labelsWithColons = true;
			config.labelsWithoutColons = true;
			const labelsColon = (settings.labels?.colon || '').toLowerCase();
			if (labelsColon.startsWith('without '))
				config.labelsWithColons = false;
			else if (labelsColon.startsWith('with '))
				config.labelsWithoutColons = false;
			const labelsExcludesString = settings.labels?.excludes || '';
			config.labelsExcludes = labelsExcludesString.toLowerCase().split(';');
			config.excludeFiles = settings.excludeFiles;
			config.enableCodeLenses = settings.enableCodeLenses;
			config.enableHovering = settings.enableHovering;
			config.enableCompletions = settings.enableCompletions;
			config.enableGotoDefinition = settings.enableGotoDefinition;
			config.enableFindAllReferences = settings.enableFindAllReferences;
			config.enableRenaming = settings.enableRenaming;
			config.enableOutlineView = settings.enableOutlineView;
			config.completionsRequiredLength = settings.completionsRequiredLength || 0;
			if (config.completionsRequiredLength < 1)
				config.completionsRequiredLength = 1;
			// Store
			Config.configs.set(fsPath, config);
			// Set global variables
			Config.globalEnableCodeLenses ||= settings.enableCodeLenses;
			Config.globalEnableHovering ||= config.enableHovering;
			Config.globalEnableCompletions ||= config.enableCompletions;
			Config.globalEnableGotoDefinition ||= config.enableGotoDefinition;
			Config.globalEnableFindAllReferences ||= config.enableFindAllReferences;
			Config.globalEnableRenaming ||= config.enableRenaming;
			Config.globalEnableOutlineView ||= config.enableOutlineView;
		}
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
