# Changelog

# 1.5.4
- Donate button added.
- What's new added.

# 1.5.3
- Fixes:
	- #40: "Hover display incorrect"
	- #41: "No completion of local label"

# 1.5.2
- Fixes:
	- #39: "Wrong substitution: e.label"
	- #38: "Completion: wrong label"
	- #37: "Outline: Data label shown as code"
	- #36: "Outline: STRUCTs wrong."
	- #34: "local labels not recognized properly?"
	- #33: "Quarte in binary numbers highlighted wrong"
	- #32: "ENDS not correctly colored"
	- #31: "Some grammar for Z80N missing"
	- #30: "Goto definition to local label not working"

# 1.5.1
- Syntax highlighting for "// ... " style comments

## 1.5.0
- Outline view tested.

## 1.4.6
- Outline view.
- Hovering now shows also EQU value if on the same line as label.
- Added sjasmplus problem matcher.

## 1.4.5
- Fixed changelog.

## 1.4.3/4
- Fixed issue #23 for Linux.
- Added anderson-arc's list of x86 instructions.
- Fixed dot command completion.

## 1.4.2
- Added more commands/fixes (kborowinski).

## 1.4.1
- Added support for more sjasmplus directives thanks to kborowinski.

## 1.4.0
- New icon.

## 1.3.2
- Fixed falsy recognition of opcodes as labels.

## 1.3.1
- Improved 'Goto Definition' and 'Rename' for concatenated (sjasmplus) labels.

## 1.3.0
- Settings fixed.
- Added settings for globbing include and exclude files.
- Fixed error reading files, sometimes wrong data was read, i.e. sometimes labels were not found.

## 1.2.2
- Added Z80 register names as proposals for completions.
- Fixed "Go to definition" for sjasmplus macros.

## 1.2.1
- Fix for hovering local labels.
- Completions for z80 instructions.

## 1.2.0
- Better support fo sjasmplus dot label notation.
- Support for sjasmplus macros.
- Recognizes sjasmplus MODULE keyword in assembly files.
- 'Go to definition' also for INCLUDE files.
- Completions implemented. Also supports sjasmplus dots notation and MODULEs.
- New settings: enableCompletions, completionsRequiredLength.
- Unit tests for regular expressions.
- Configurable through settings.json.
- Added syntax highlighting.

## 1.1.0
- HoverProvider can be enabled/disabled in the settings.
- DefinitionProvider added.
- New Command: asm-code-lens.find-labels-with-no-reference. Searches all labels and shows the ones that are not referenced.
- Bugfixes.

## 1.0.1
- Readme updated.

## 1.0.0
- Initial marketplace release.

## 0.2.0
Added.
- Code Lens
- Hover support
- Symbol renaming

## 0.1.0
- Initial version. Support for "Find all references".

