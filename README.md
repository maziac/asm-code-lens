# Support

If you like ASM-Code-Lens please consider supporting it.

<style>
.button--flat-primary {
  background: none;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  display: inline-block;
  font-size: 0.8em;
  letter-spacing: 0.25em;
  margin: 1em 0.5em;
  padding: 1em 1.75em;
  text-decoration: none;
  text-transform: uppercase;
  user-select: none;
  white-space: nowrap;

  outline: none;

  background-color: var(--vscode-button-background);
  border: 1px solid var(--vscode-button-background);
  color: white !important;
  font-weight: 600;
  transition: background-color 250ms, border-color 250ms, color 250ms;
}
</style>

<div>
    <a class="button button--flat-primary" title="Donate via PayPal"
        href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8S4R8HPXVCXUL&source=url"
        target="_blank">Donate via PayPal</a>
    <a class="button button--flat-primary" title="Become a sponsor on Github" href="https://github.com/sponsors/maziac"
       target="_blank">Other</a>
</div>

# ASM Code Lens

![](assets/remote/codelens_usage.gif)

'ASM Code Lens' is a language server extension for Visual Studio Code for assembler files.
It provides support for:
- Assembler syntax highlighting.
- Completions: While you type completions are proposed based on the labels in your asm files.
- "Find all references": through a right mouse click in your assembler source file. It will come up with all found references in the other files.
- Hovering: When hovering over a symbol it shows the comments for the symbol.
- Outline view: View your labels (code, data, constants) in the outline view.
- Rename symbols.
- Code Lens: Above symbols the number of references is shown. Clicking it reveals the references.
- Find all labels that are not EQU and are not referenced. Useful to find dead code.
- Supports e.g. sjasmplus (with dot notation, also MODULE and STRUCTs), Savannah's z80asm, z88dk assembler and many other assemblers that use a standard notation for labels (e.g. "label:").

Please refer to the "Feature Contributions" tab to see how to enable/disable certain features


## Installation

Install through Visual Studio Code Marketplace.
The extension is called "ASM Code Lens".

It supports assembler source files and list files by defining the language identifiers "Assembler file" ('asm-collection') and "Assembler list file" ('asm-list-file').
Your file has to be associated to one of those languages.
By default "Assembler file" contains the following suffixes:
- .asm
- .inc
- .s
- .a80
- .z80

The "Assembler list file" defaults to:
- .list
- .lis

But you can manually add any file or file suffixes to the language ids via vscode (language mode).


## Hexadecimal Calculator

A view in the sidebar of the explorer and the sidebar in debug mode.
It adds a decimal and hexadecimal calculator to vscode.
It always shows 2 columns: decimal and hexadecimal.
If you enter a number in one column it is automatically converted to the other type.

This way it is easily possible to mix calculations between decimal and hexadecimal.

The calculator allows the basic integer calculations:
- addition
- subtraction
- multiplication
- division

![](assets/remote/hexcalculator.gif)


## Outline View

An outline view of the assembly can be shown like this:

![](assets/remote/outline_view.jpg)

"ASM Code Lens" uses some heuristics to tell what labels are data, const or code.
So be aware that it's decision might be wrong sometimes.

Note: The outline view also supports sjasmplus MODULE information.


## Find Dead Code

With a right click on a text editor (an asm file) and by selecting 'Find Labels with no Reference'
![](assets/remote/find-labels-with-no-reference.jpg)
you get a list of labels (in the OUTPUT pane) that are not referenced anywhere in all files.

This can be useful to find any dead code because code or data that is not referenced is probably not used or the label is superfluous.


## Problem Matcher

For the [sjasmplus](https://github.com/z00m128/sjasmplus) assembler there is a problem matcher included to ease the navigation to compile errors.

You can use it simply by adding the following line to your tasks.json:
~~~
"problemMatcher": "$problem-matcher-sjasmplus",
~~~


## Hovers in Debug Mode

vscode turns the normal hovers off if in debug mode. To make them visible press the "ALT" key while hovering.


## Syntax highlighting in Markdown code blocks

Assembler syntax highlighting can also be used within Markdown documents.
Just add ```asm``` (or ```list```) to your code blocks.

Here is an example:
```
# Mainloop

The following code is the main loop of the program:

~~~asm
main_loop:
    ; fill line with color
    ld hl,(fill_colors_ptr)
    ld a,(hl)
    call fill_bckg_line

    ; next line
    call inc_fill_colors_ptr

    jr main_loop
~~~
```

Which results in the following highlighting:
![](assets/remote/md_code_blocks.jpg)



# Known Issues

- [Code Lens: "actual command not found" #81](https://github.com/maziac/asm-code-lens/issues/81): Sometime "actual command not found" is shown when clicking on references. This seems to be healed by closing/openign the file. Could be a vscode issue.
- [CodeLens lifetime #57227](https://github.com/Microsoft/vscode/issues/57227): Updates of the CodeLens is not working optimal. At the moment it is necessary to reload or save the file to update the CodeLens info.
- This extension doesn't use a structured approach but just looks at all asm files without hierarchy. This means that sjasmplus MODULE definitions are only taken into account if they are used within the same file.


# License and Acknowledgements

ASM-Code-Lens is licensed under the [MIT license](https://github.com/maziac/dezog/blob/master/LICENSE.txt).

This extension made use of 3 other packages:
- [find all references](https://github.com/gayanhewa/vscode-find-all-references) by gayanhewa, MIT License
- [grob](https://www.npmjs.com/package/grob) by jamiebuilds, MIT License
- [vscode-whats-new](https://github.com/alefragnani/vscode-whats-new) project from Alessandro Fragnani aka [alefragni](https://github.com/alefragnani), MIT License

I also included the grammar for syntax highlighting from Martin Bórik's vscode extension [z80-macroasm-vscode](https://github.com/mborik/z80-macroasm-vscode) because I got problems when running both extensions at the same time and I could not turn off features selectively.
I.e. I copied the files language.configuration.json and z80-macroasm.tmLanguage.json. The z80-macroasm-vscode extension itself was forked from Imanol Barriuso's vscode extension [z80asm-vscode](https://github.com/Imanolea/z80asm-vscode). MIT license, copyright (c) 2016 Imanol Barriuso (Imanolea).

Many thanks to the authors.

I also would like to thank these authors for contributions:
- [kborowinski](https://github.com/kborowinski) for PRs regarding sjasmplus ([#20](https://github.com/maziac/asm-code-lens/pull/20), [#21](https://github.com/maziac/asm-code-lens/pull/21), [#22](https://github.com/maziac/asm-code-lens/pull/22), [#44](https://github.com/maziac/asm-code-lens/pull/44), [#47](https://github.com/maziac/asm-code-lens/pull/47), [#50](https://github.com/maziac/asm-code-lens/pull/50)).
- [chrijbel](https://github.com/chribjel) for PR [Added support for changing the line comment prefix](https://github.com/maziac/asm-code-lens/pull/53).
- [64kramsystem](https://github.com/64kramsystem) for PR [Add syntax highlight to Markdown code blocks](https://github.com/maziac/asm-code-lens/pull/65).
