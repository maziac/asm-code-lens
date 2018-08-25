'use strict';

import * as vscode from 'vscode';
import { ReferenceProvider } from './ReferenceProvider';
import { HoverProvider } from './HoverProvider';
import { CodeLensProvider } from './CodeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    //const ASM_LANGUAGE: vscode.DocumentFilter = { pattern: '**/*.{asm,s,a80,inc}' };
    const asmFiles = "asm-files";
    context.subscriptions.push(
        //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
        vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider()),

        vscode.languages.registerHoverProvider(asmFiles, new HoverProvider()),

        vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider()),
        
        vscode.commands.registerCommand('extension.asmcodelens.getrefrences', args => {
         })
    
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
