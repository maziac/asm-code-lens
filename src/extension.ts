import * as vscode from 'vscode';
import * as path from 'path';
import {ReferenceProvider} from './ReferenceProvider';
import {DefinitionProvider} from './DefinitionProvider';
import {HoverProvider} from './HoverProvider';
import {CodeLensProvider} from './CodeLensProvider';
import {RenameProvider} from './RenameProvider';
import {DocumentSymbolProvider} from './DocumentSymbolProvider';
import {CompletionProposalsProvider} from './CompletionProposalsProvider';
import {Commands} from './Commands';
import {setGrepGlobPatterns} from './grep';
import {setCustomCommentPrefix} from './comments';
import {HexCalcProvider} from './HexCalcProvider';
import {WhatsNewView} from './whatsnew/whatsnewview';
import {PackageInfo} from './whatsnew/packageinfo';
import {GlobalStorage} from './globalstorage';
import {getLabelsConfig} from './config';



export function activate(context: vscode.ExtensionContext) {

    // Init package info
    PackageInfo.Init(context);

    // Init global storage
    GlobalStorage.Init(context);

    // Check version and show 'What's new' if necessary.
    const mjrMnrChanged = WhatsNewView.updateVersion(context);
    if (mjrMnrChanged) {
        // Major or minor version changed so show the whatsnew page.
        new WhatsNewView(); // NOSONAR
    }
    // Register the additional command to view the "Whats' New" page.
    context.subscriptions.push(vscode.commands.registerCommand("asm-code-lens.whatsNew", () => new WhatsNewView()));


    // Register the hex calculator webviews
    hexCalcExplorerProvider = new HexCalcProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("asm-code-lens.calcview-explorer", hexCalcExplorerProvider, {webviewOptions: {retainContextWhenHidden: true}})
    );
    hexCalcDebugProvider = new HexCalcProvider();
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider("asm-code-lens.calcview-debug", hexCalcDebugProvider, {webviewOptions: {retainContextWhenHidden: true}})
    );

    // Enable logging.
    configure(context);

    // Check for every change.
	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        configure(context, event);
    }));

    // Register command once.
    vscode.commands.registerCommand('asm-code-lens.find-labels-with-no-reference', () => {
        // Get current text editor to get current project/root folder.
        const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath || '';
        // Get all workspace folders
        const wsFolders = (vscode.workspace.workspaceFolders || []).map(ws => ws.uri.fsPath + path.sep);
        const config = getLabelsConfig();
        // Check in which workspace folder the path is included
        for (const rootFolder of wsFolders) {
            if (editorPath.includes(rootFolder)) {
                // Add root folder
                config.rootFolder = rootFolder;
                // Found. Find labels
                Commands.findLabelsWithNoReference(config);
                // Stop loop
                break;
            }
        }
    });
}


/**
 * Reads the configuration.
 */
function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
    // Note: All configuration preferences are scoped 'window' which means:
    // user, workspace or remote.
    // So, in multiroot configurations all folders share the same settings.
    // There are no special settings for the different multiroot folders.
    const settings = PackageInfo.getConfiguration();

    // Get all workspace folders
    const wsFolders = (vscode.workspace.workspaceFolders || []).map(ws => ws.uri.fsPath + path.sep);

    // Check for the hex calculator params
    if (event) {
        if (event.affectsConfiguration('asm-code-lens.hexCalculator.hexPrefix')
            || event.affectsConfiguration('asm-code-lens.donated')) {
            // Update the hex calculators
            if (hexCalcExplorerProvider)
                hexCalcExplorerProvider.setMainHtml();
            if (hexCalcDebugProvider)
                hexCalcDebugProvider.setMainHtml();
        }
    }

    // Dispose (remove) all providers
    for (const rootFolder of wsFolders) {
        // Deregister
        removeProvider(regCodeLensProviders.get(rootFolder), context);
        removeProvider(regHoverProviders.get(rootFolder), context);
        removeProvider(regCompletionProposalsProviders.get(rootFolder), context);
        removeProvider(regDefinitionProviders.get(rootFolder), context);
        removeProvider(regReferenceProviders.get(rootFolder), context);
        removeProvider(regRenameProviders.get(rootFolder), context);
        removeProvider(regDocumentSymbolProviders.get(rootFolder), context);

    }
    regCodeLensProviders.clear();
    regHoverProviders.clear();
    regCompletionProposalsProviders.clear();
    regDefinitionProviders.clear();
    regReferenceProviders.clear();
    regRenameProviders.clear();
    regDocumentSymbolProviders.clear();


    // Set search paths.
    setGrepGlobPatterns(settings.includeFiles, settings.excludeFiles);

    // Get some settings.
    const configWoRoot = getLabelsConfig();


    // Note: don't add 'language' property, otherwise other extension with similar file pattern may not work.
    // If the identifier is missing it also doesn't help to define it in package.json. And if "id" would be used it clashes again with other extensions.
    const asmFiles: vscode.DocumentSelector = {scheme: "file", pattern: settings.includeFiles};

    // Multiroot: do for all root folders:
    for (const rootFolder of wsFolders) {
        // Copy config
        const config = {...configWoRoot};
        // For multiroot
        config.rootFolder = rootFolder;

        // Code Lenses
        if (settings.enableCodeLenses) {
            // Register
            const provider = vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider(config));
            regCodeLensProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableHovering) {
            // Register
            const provider = vscode.languages.registerHoverProvider(asmFiles, new HoverProvider(config));
            regHoverProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableCompletions) {
            // Register
            const provider = vscode.languages.registerCompletionItemProvider(asmFiles, new CompletionProposalsProvider(config));
            regCompletionProposalsProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableGotoDefinition) {
            // Register
            const provider = vscode.languages.registerDefinitionProvider(asmFiles, new DefinitionProvider(config));
            regDefinitionProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableFindAllReferences) {
            // Register
            const provider = vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider(rootFolder));
            regReferenceProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableRenaming) {
            // Register
            const provider = vscode.languages.registerRenameProvider(asmFiles, new RenameProvider(rootFolder));
            regRenameProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }

        if (settings.enableOutlineView) {
            // Register
            const provider = vscode.languages.registerDocumentSymbolProvider(asmFiles, new DocumentSymbolProvider(config));
            regDocumentSymbolProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }


    // Toggle line Comment configuration
    const toggleCommentPrefix = settings.get<string>("comments.toggleLineCommentPrefix") || ';';
    vscode.languages.setLanguageConfiguration("asm-collection", {comments: {lineComment: toggleCommentPrefix}});
    // Store
    setCustomCommentPrefix(toggleCommentPrefix);
}


/**
 * Removes a provider.
 * Disposes it and removes it from subscription list.
 */
function removeProvider(pv: vscode.Disposable|undefined, context: vscode.ExtensionContext) {
    if (pv) {
        pv.dispose();
        const i = context.subscriptions.indexOf(pv);
        context.subscriptions.splice(i, 1);
    }
}


let hexCalcExplorerProvider;
let hexCalcDebugProvider;
let regCodeLensProviders = new Map<string, vscode.Disposable>();
let regHoverProviders = new Map<string, vscode.Disposable>();
let regCompletionProposalsProviders = new Map<string, vscode.Disposable>();
let regDefinitionProviders = new Map<string, vscode.Disposable>();
let regReferenceProviders = new Map<string, vscode.Disposable>();
let regRenameProviders = new Map<string, vscode.Disposable>();
let regDocumentSymbolProviders = new Map<string, vscode.Disposable>();




// this method is called when your extension is deactivated
/*
export function deactivate() {
}
*/
