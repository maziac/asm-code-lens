'use strict';

import * as vscode from 'vscode';
import { ReferenceProvider } from './ReferenceProvider';
import { HoverProvider } from './HoverProvider';
import { CodeLensProvider } from './CodeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    //const ASM_LANGUAGE: vscode.DocumentFilter = { pattern: '**/*.{asm,s,a80,inc}' };
    //const asmFiles = "asm-files";
    const asmFiles: vscode.DocumentSelector = { language: "asm-files", scheme: "file" };
    context.subscriptions.push(
        //vscode.languages.registerReferenceProvider(ASM_LANGUAGE, new ReferenceProvider())
        vscode.languages.registerReferenceProvider(asmFiles, new ReferenceProvider())
    );

    context.subscriptions.push(
        vscode.languages.registerHoverProvider(asmFiles, new HoverProvider()),
    );

    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(asmFiles, new CodeLensProvider()),
    );

}

// this method is called when your extension is deactivated
export function deactivate() {
}
