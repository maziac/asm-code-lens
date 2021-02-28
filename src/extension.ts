import * as vscode from 'vscode';
import {ReferenceProvider} from './ReferenceProvider';
import {DefinitionProvider} from './DefinitionProvider';
import {HoverProvider} from './HoverProvider';
import {CodeLensProvider} from './CodeLensProvider';
import {RenameProvider} from './RenameProvider';
import {DocumentSymbolProvider} from './DocumentSymbolProvider';
import {CompletionProposalsProvider} from './CompletionProposalsProvider';
import {Commands} from './Commands';
import {setGrepGlobPatterns} from './grep';
import {HexCalcProvider} from './HexCalcProvider';
import {WhatsNewView} from './whatsnew/whatsnewview';
import {PackageInfo} from './whatsnew/packageinfo';
import {GlobalStorage} from './globalstorage';


export function activate(context: vscode.ExtensionContext) {

    // Init package info
    PackageInfo.Init(context);

    // Init global storage
    GlobalStorage.Init(context);

    // Check version and show 'What's new' if necessary.
    const mjrMnrChanged = WhatsNewView.updateVersion(context);
    if (mjrMnrChanged) {
        // Major or minor version changed so show the whatsnew page.
        new WhatsNewView();
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
        Commands.findLabelsWithNoReference();
    });
}


/**
 * Reads the confguration.
 */
function configure(context: vscode.ExtensionContext, event?: vscode.ConfigurationChangeEvent) {
    const settings = PackageInfo.getConfiguration();

    // Get all workspace folders
    const wsFolders = (vscode.workspace.workspaceFolders || []).map(ws => ws.uri.fsPath);

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

    // Check if grep paths have changed
    if(event) {
        if(event.affectsConfiguration('asm-code-lens.includeFiles')
            || event.affectsConfiguration('asm-code-lens.excludeFiles')) {
            // Restart provider if running:
            // CodeLens
            for (const rootFolder of wsFolders) {
                // Deregister
                regCodeLensProviders.get(rootFolder)!.dispose();
                regReferenceProviders.get(rootFolder)!.dispose();
                regRenameProviders.get(rootFolder)!.dispose();
            }
            regCodeLensProviders.clear();
            regReferenceProviders.clear();
            regRenameProviders.clear();
        }
    }

    // Set search paths.
    setGrepGlobPatterns(settings.includeFiles, settings.excludeFiles);


    // Note: don't add 'language' property, otherwise other extension with similar file pattern may not work.
    // If the identifier is missing it also don't help to define it in package.json. And if "id" would be used it clashes again with other extensions.
    const asmFiles: vscode.DocumentSelector = {scheme: "file", pattern: settings.includeFiles};

    // Code Lenses
    if(settings.enableCodeLenses) {
        // Register
        for (const rootFolder of wsFolders) {
            const provider = vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider(rootFolder));
            regCodeLensProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }
    else {
        for (const rootFolder of wsFolders) {
            // Deregister
            regCodeLensProviders.get(rootFolder)!.dispose();
        }
        regCodeLensProviders.clear();
    }

    if (settings.enableHovering) {
        // Register
        for (const rootFolder of wsFolders) {
            const provider = vscode.languages.registerHoverProvider(asmFiles, new HoverProvider(rootFolder));
            regHoverProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }
    else {
        for (const rootFolder of wsFolders) {
            // Deregister
            regHoverProviders.get(rootFolder)!.dispose();
        }
        regHoverProviders.clear();
    }

    if(settings.enableCompletions) {
        if(!regCompletionProposalsProvider) {
            // Register
            regCompletionProposalsProvider = vscode.languages.registerCompletionItemProvider(asmFiles, new CompletionProposalsProvider());
            context.subscriptions.push(regCompletionProposalsProvider);

        }
    }
    else {
        if(regCompletionProposalsProvider) {
            // Deregister
            regCompletionProposalsProvider.dispose();
            regCompletionProposalsProvider = undefined;
        }
    }

    if (settings.enableGotoDefinition) {
        // Register
        for (const rootFolder of wsFolders) {
            const provider = vscode.languages.registerDefinitionProvider(asmFiles, new DefinitionProvider(rootFolder));
            regDefinitionProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }
    else {
        for (const rootFolder of wsFolders) {
            // Deregister
            regDefinitionProviders.get(rootFolder)!.dispose();
        }
        regDefinitionProviders.clear();
    }

    if (settings.enableFindAllReferences) {
        // Register
        for (const rootFolder of wsFolders) {
            const provider = vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider(rootFolder));
            regReferenceProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }
    else {
        for (const rootFolder of wsFolders) {
            // Deregister
            regReferenceProviders.get(rootFolder)!.dispose();
        }
        regReferenceProviders.clear();
    }

    if (settings.enableRenaming) {
        // Register
        for (const rootFolder of wsFolders) {
            const provider = vscode.languages.registerRenameProvider(asmFiles, new RenameProvider(rootFolder));
            regRenameProviders.set(rootFolder, provider);
            context.subscriptions.push(provider);
        }
    }
    else {
        for (const rootFolder of wsFolders) {
            // Deregister
            regRenameProviders.get(rootFolder)!.dispose();
        }
        regRenameProviders.clear();
    }

    if (settings.enableOutlineView) {
        if (!regDocumentSymbolProvider) {
            // Register
            regDocumentSymbolProvider=vscode.languages.registerDocumentSymbolProvider(asmFiles, new DocumentSymbolProvider());
            context.subscriptions.push(regDocumentSymbolProvider);
        }
    }
    else {
        if (regDocumentSymbolProvider) {
            // Deregister
            regDocumentSymbolProvider.dispose();
            regDocumentSymbolProvider=undefined;
        }
    }

    // Toggle line Comment configuration
    const toggleCommentPrefix = settings.get<string>("comments.toggleLineCommentPrefix") || ';';
    vscode.languages.setLanguageConfiguration("asm-collection", {comments: {lineComment: toggleCommentPrefix}});
}


let hexCalcExplorerProvider;
let hexCalcDebugProvider;
let regCodeLensProviders = new Map<string, vscode.Disposable>();
let regHoverProviders = new Map<string, vscode.Disposable>();
let regCompletionProposalsProvider;
let regDefinitionProviders = new Map<string, vscode.Disposable>();
let regReferenceProviders = new Map<string, vscode.Disposable>();
let regRenameProviders = new Map<string, vscode.Disposable>();
let regDocumentSymbolProvider;




// this method is called when your extension is deactivated
export function deactivate() {
}
