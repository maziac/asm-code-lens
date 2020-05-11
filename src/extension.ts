'use strict';

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

export function activate(context: vscode.ExtensionContext) {
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
    const settings = vscode.workspace.getConfiguration('asm-code-lens');
    
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
