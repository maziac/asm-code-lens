'use strict';

import * as vscode from 'vscode';
import { ReferenceProvider } from './ReferenceProvider';
import { DefinitionProvider } from './DefinitionProvider';
import { HoverProvider } from './HoverProvider';
import { CodeLensProvider } from './CodeLensProvider';
import { RenameProvider } from './RenameProvider';
import { CompletionProposalsProvider } from './CompletionProposalsProvider';
import { Commands } from './Commands';

export function activate(context: vscode.ExtensionContext) {
    const settings = vscode.workspace.getConfiguration('asm-code-lens');
    
    // Note: don't add 'language' property, otherwise other extension with similar file pattern may not work.
    // If the identifier is missing it also don't help to define it in package.json. And if "id" would be used it clashes again with other extensions.
    const asmFiles: vscode.DocumentSelector = { scheme: "file", pattern:"**/*.{asm,s,a80,inc}"};

    context.subscriptions.push(
        //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
        vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(asmFiles, new DefinitionProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(asmFiles, new HoverProvider()),
    );

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider()),
    );

    context.subscriptions.push(
        vscode.languages.registerRenameProvider(asmFiles, new RenameProvider()),
    );

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(asmFiles, new CompletionProposalsProvider()),
    );

    vscode.commands.registerCommand('asm-code-lens.find-labels-with-no-reference', () => {
        Commands.findLabelsWithNoReference(); 
    });
   
}

// this method is called when your extension is deactivated
export function deactivate() {
}
