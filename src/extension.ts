'use strict';

import * as vscode from 'vscode';
import { ReferenceProvider } from './ReferenceProvider';
import { HoverProvider } from './HoverProvider';

export function activate(context: vscode.ExtensionContext) {
    //const ASM_LANGUAGE: vscode.DocumentFilter = { pattern: '**/*.{asm,s,a80,inc}' };
    const asmFiles = "asm-files";
    context.subscriptions.push(
        //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
        vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider())
    );
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(asmFiles, new HoverProvider())
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
