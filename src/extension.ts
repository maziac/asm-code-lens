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

export function activate(context: vscode.ExtensionContext) {

    // Save the extension path
    PackageInfo.setExtensionPath(context.extensionPath);

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
function configure(context: vscode.ExtensionContext, event?) {
    const settings = vscode.workspace.getConfiguration('asm-code-lens', null);

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
            if(regCodeLensProvider) {
                // Deregister
                regCodeLensProvider.dispose();
                regCodeLensProvider = undefined;
            }
            if(regReferenceProvider) {
                // Deregister
                regReferenceProvider.dispose();
                regReferenceProvider = undefined;
            }
            if(regRenameProvider) {
                // Deregister
                regRenameProvider.dispose();
                regRenameProvider = undefined;
            }
        }
    }

    // Set search paths.
    setGrepGlobPatterns(settings.includeFiles, settings.excludeFiles);


    // Note: don't add 'language' property, otherwise other extension with similar file pattern may not work.
    // If the identifier is missing it also don't help to define it in package.json. And if "id" would be used it clashes again with other extensions.
    const asmFiles: vscode.DocumentSelector = {scheme: "file", pattern: settings.includeFiles};

    // Code Lenses
    if(settings.enableCodeLenses) {
        if(!regCodeLensProvider) {
            // Register
            regCodeLensProvider = vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider());
            context.subscriptions.push(regCodeLensProvider);
        }
    }
    else {
        if(regCodeLensProvider) {
            // Deregister
            regCodeLensProvider.dispose();
            regCodeLensProvider = undefined;
        }
    }

    if(settings.enableHovering) {
        if(!regHoverProvider) {
            // Register
            regHoverProvider = vscode.languages.registerHoverProvider(asmFiles, new HoverProvider());
            context.subscriptions.push(regHoverProvider);
        }
    }
    else {
        if(regHoverProvider) {
            // Deregister
            regHoverProvider.dispose();
            regHoverProvider = undefined;
        }
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

    if(settings.enableGotoDefinition) {
        if(!regDefinitionProvider) {
            // Register
            regDefinitionProvider = vscode.languages.registerDefinitionProvider(asmFiles, new DefinitionProvider());
            context.subscriptions.push(regDefinitionProvider);
        }
    }
    else {
        if(regDefinitionProvider) {
            // Deregister
            regDefinitionProvider.dispose();
            regDefinitionProvider = undefined;
        }
    }

    if(settings.enableFindAllReferences) {
        if(!regReferenceProvider) {
            // Register
            //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
            regReferenceProvider = vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider());
            context.subscriptions.push(regReferenceProvider);
        }
    }
    else {
        if(regReferenceProvider) {
            // Deregister
            regReferenceProvider.dispose();
            regReferenceProvider = undefined;
        }
    }

    if (settings.enableRenaming) {
        if (!regRenameProvider) {
            // Register
            regRenameProvider=vscode.languages.registerRenameProvider(asmFiles, new RenameProvider());
            context.subscriptions.push(regRenameProvider);
        }
    }
    else {
        if (regRenameProvider) {
            // Deregister
            regRenameProvider.dispose();
            regRenameProvider=undefined;
        }
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
}

let hexCalcExplorerProvider;
let hexCalcDebugProvider;
let regCodeLensProvider;
let regHoverProvider;
let regCompletionProposalsProvider;
let regDefinitionProvider;
let regReferenceProvider;
let regRenameProvider;
let regDocumentSymbolProvider;




// this method is called when your extension is deactivated
export function deactivate() {
}
