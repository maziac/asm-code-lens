'use strict';

import * as vscode from 'vscode';
import { ReferenceProvider } from './Providers/ReferenceProvider';

export function activate(context: vscode.ExtensionContext) {
    //const ASM_LANGUAGE: vscode.DocumentFilter = { pattern: '**/*.{asm,s,a80,inc}' };
    context.subscriptions.push(
        //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
        vscode.languages.registerReferenceProvider("asm-collection", new ReferenceProvider())
    );
}

// this method is called when your extension is deactivated
export function deactivate() {
}
