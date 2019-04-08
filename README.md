# ASM Code Lense

![](assets/codelens_usage.gif)

'ASM Code Lense' is a language server extension for Visual Studio Code for assembler files.
It provides support for:
- Completions: While you type completions are proposed based on the labels in your asm files.
- "Find all references": through a right mouse click in your assembler source file. It will come up with all found references in the other files.
- Hovering: When hovering over  symbol it shows the comments for the symbol.
- Rename symbols.
- Code Lens: Above symbols it shows the number of references. You can click it to get to the references.
- Command: asm-code-lens.find-labels-with-no-reference to find all labels that are not EQU and are not referenced. Useful to find dead code.
- Supports e.g. sjasmplus (with dot notation, also MODULE and STRUCTs), Savannah's z80asm, z88dk assembler and most probably many other assemblers that use a standard notation for labels (e.g. "label:").


## Installation

Install through Visual Studio Code Marketplace.
The extension is called "ASM Code Lens".

It supports the following assembler file extensions:
.asm, .s, .inc, .a80.


## Known Issues

- [CodeLens lifetime #57227](https://github.com/Microsoft/vscode/issues/57227): Updates of the CodeLens is not working optimal. At the moment it is necessary to reload or save the file to update the CodeLens info.
- This extension doesn't use a structured approach but just looks at all asm files without hierarchy. This means that sjasmplus MODULE definitions are only taken into account if they are used within the same file.


## Acknowledgements

This extension made use of code from 2 other packages:
- [find all references](https://github.com/gayanhewa/vscode-find-all-references) by gayanhewa
- [grob](https://www.npmjs.com/package/grob) by jamiebuilds

I also included the grammar for syntax highlighting from Imanol Barriuso's vscode extension [z80-macroasm-vscode](https://github.com/mborik/z80-macroasm-vscode) because I got problems when running both extensions at the same time and I could not turn off features selectively.
I.e. I copied the files language.configuration.json and z80-macroasm.tmLanguage.json (Copyright (c) 2016 Imanol Barriuso (Imanolea)).


Many thanks to the authors.
