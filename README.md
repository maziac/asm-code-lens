# ASM Code Lense

This is a language server extension for Visual Studio Code for the assembler programming language.
It provides support for:
- "Find all references": through a right mouse click in your assembler source file. It will come up with all found references in the other files.
- Hovering: When hovering over  symbol it shows the comments for the symbol.
- Rename symbols.
- Code Lens: Above symbols it shows the number of references. You can click it to get to the references.


## Known Issues

- [CodeLens lifetime #57227](https://github.com/Microsoft/vscode/issues/57227): Updates of the CodeLens is not working optimal. At the moment it is necessar to reload or save the file to update the CodeLens info.


## Acknowledgements

This extension made use of code from 2 other packages:
- [find all references](https://github.com/gayanhewa/vscode-find-all-references) by gayanhewa
- [grob](https://www.npmjs.com/package/grob) by jamiebuilds
Many thanks to the authors.
