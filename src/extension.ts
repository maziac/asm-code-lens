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
//import {setGrepGlobPatterns} from './grep';
import {setCustomCommentPrefix} from './comments';
import {HexCalcProvider} from './HexCalcProvider';
import {WhatsNewView} from './whatsnew/whatsnewview';
import {PackageInfo} from './whatsnew/packageinfo';
import {GlobalStorage} from './globalstorage';
import {Config} from './config';
import {DonateInfo} from './donate/donateinfo';



export function activate(context: vscode.ExtensionContext) {

    // Init package info
    PackageInfo.Init(context);

    // Init global storage
    GlobalStorage.Init(context);

    // Check version for donate info
    DonateInfo.checkVersion();

    // Check version and show 'What's new' if necessary.
    const mjrMnrChanged = WhatsNewView.updateVersion();
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

    // Register commands.
    vscode.commands.registerCommand('asm-code-lens.find-labels-with-no-reference', () => {
        findLabelsWithNoReferenceAllRootFolders();
    });
}


/**
 * Finds labels with no reference for all root folders.
 */
function findLabelsWithNoReferenceAllRootFolders() {
    // Get current text editor to get current project/root folder.
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    const languageId = editor.document.languageId;
    if (languageId != 'asm-collection' && languageId != 'asm-list-file')
        return;
    const editorPath =editor.document.uri.fsPath;
    // Get all workspace folders
    const wsFolders = (vscode.workspace.workspaceFolders || []).map(ws => ws.uri.fsPath + path.sep);
    /* TODO: Enable again
    const config = getLabelsConfig();
    // Check in which workspace folder the path is included
    for (const rootFolder of wsFolders) {
        if (editorPath.includes(rootFolder)) {
            // Add root folder
            config.wsFolderPath = rootFolder;
            // Found. Find labels
            Commands.findLabelsWithNoReference(config, languageId);
            // Stop loop
            break;
        }
    }
    */
}


/**
 * Reads the configuration.
 */
function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
    // Note: configuration preferences scopes
    // - "window": user, workspace or remote.
    // - "resource": user, workspace, folder or remote.
    // - "application": user only.
    // So in multiroot different workspaces have different settings.

    const settings = PackageInfo.getConfiguration();
    // Check for the hex calculator params
    if (event) {
        if (event.affectsConfiguration('asm-code-lens.hexCalculator.hexPrefix')
            || event.affectsConfiguration('asm-code-lens.donated')) {
            // Update the hex calculators
            if (hexCalcExplorerProvider)
                hexCalcExplorerProvider.setMainHtml();
            if (hexCalcDebugProvider)
                hexCalcDebugProvider.setMainHtml();
            // Update the donate info
            DonateInfo.donatedPreferencesChanged();
        }
    }

    // Dispose (remove, deregister) all providers
    removeProvider(regCodeLensProvider, context);
    removeProvider(regHoverProvider, context);
    removeProvider(regCompletionProposalsProvider, context);
    removeProvider(regDefinitionProvider, context);
    removeProvider(regReferenceProvider, context);
    removeProvider(regRenameProvider, context);
    removeProvider(regDocumentSymbolProvider, context);


    // Re-read settings for all workspaces.
    Config.init();

    // Both "languages": asm files and list files.
    const asmListFiles: vscode.DocumentSelector = [
        {scheme: "file", language: 'asm-collection'},
        {scheme: "file", language: 'asm-list-file'}
    ];

    // Multiroot: One provider for all workspace folders:

    // Register
    const codeLensProvider = new CodeLensProvider();
    regCodeLensProvider = vscode.languages.registerCodeLensProvider(asmListFiles, codeLensProvider);
    context.subscriptions.push(regCodeLensProvider);

    // Register
    regHoverProvider = vscode.languages.registerHoverProvider(asmListFiles, new HoverProvider());
    context.subscriptions.push(regHoverProvider);

    // Register
    regCompletionProposalsProvider = vscode.languages.registerCompletionItemProvider(asmListFiles, new CompletionProposalsProvider());
    context.subscriptions.push(regCompletionProposalsProvider);

    // Register
    regDefinitionProvider = vscode.languages.registerDefinitionProvider(asmListFiles, new DefinitionProvider());
    context.subscriptions.push(regDefinitionProvider);

    /*
    // Register
    regReferenceProvider = vscode.languages.registerReferenceProvider(asmListFiles, new ReferenceProvider());
    context.subscriptions.push(regReferenceProvider);

    // Register
    regRenameProvider = vscode.languages.registerRenameProvider(asmListFiles, new RenameProvider());
    context.subscriptions.push(regRenameProvider);

    // Register
    regDocumentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(asmListFiles, new DocumentSymbolProvider());
    context.subscriptions.push(regDocumentSymbolProvider);
*/


    // Toggle line Comment configuration
    const toggleCommentPrefix = settings.get<string>("comments.toggleLineCommentPrefix") || ';';    // TODO: global or per workspace?
    vscode.languages.setLanguageConfiguration("asm-collection", {comments: {lineComment: toggleCommentPrefix}});
    // Store
    setCustomCommentPrefix(toggleCommentPrefix);

    console.log(Config.configs);
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
let regCodeLensProvider: vscode.Disposable;
let regHoverProvider: vscode.Disposable;
let regCompletionProposalsProvider: vscode.Disposable;
let regDefinitionProvider: vscode.Disposable;
let regReferenceProvider: vscode.Disposable;
let regRenameProvider: vscode.Disposable;
let regDocumentSymbolProvider: vscode.Disposable;




// this method is called when your extension is deactivated
/*
export function deactivate() {
}
*/
