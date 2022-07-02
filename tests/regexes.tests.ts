import * as assert from 'assert';
import * as re from '../src/regexes/regexes';
import {RenameRegexes} from '../src/regexes/RenameRegexes';
import {CompletionRegexes} from '../src/regexes/CompletionRegexesren';


// For access to protected functions.
const CompletionRegexesMock = CompletionRegexes as any;


suite('RegExes', () => {

    suite('Simple regexes', () => {

        function checkResultsMatch(regex: RegExp, insOuts: (string | boolean)[]) {
            try {
                // Check the test
                const count = insOuts.length;
                const div = 2;  // Line divider
                assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for (let i = 0; i < count; i += div) {
                    const input = insOuts[i] as string;
                    const shouldMatch = insOuts[i + 1];
                    const result = regex.exec(input);
                    if (result) {
                        assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i / div));
                    }
                    else {
                        assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i / div));
                    }
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexLabelEquOrMacro', (done) => {
            const regex = re.regexLabelEquOrMacro();
            const insOuts = [
                // input-line, match
                "label:equ", true,
                "label:macro", true,
                "label: MACRO", true,
                "label: equ", true,
                "label: equ;", true,

                "label: equ ;", true,
                "label equ", true,
                "label equ ", true,
                "label equ;", true,
                "equ  ", false,
                " equ  ", false,

                // For list file
                "6017.R11 00 AF     label: equ ", true,
                "39+ 6017           label: macro", true,
                "29    0012  D3 FE  label: equ ", true,
                "625++C4D1          label: equ ", true,
                "626++C4D1 FE 10    label: equ ", true,
            ];

            checkResultsMatch(regex, insOuts);
            done();
        });


        function checkResultsMatchFound(regex: RegExp, insOuts: (string | boolean)[], matchIndex = 1) {
            try {
                // Check the test
                const count = insOuts.length;
                const div = 3;  // Line divider
                assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for (let i = 0; i < count; i += div) {
                    const input = insOuts[i] as string;
                    const shouldMatch = insOuts[i + 1];
                    const shouldFind = insOuts[i + 2];
                    const result = regex.exec(input);
                    if (result) {
                        assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i / div));
                        const found = result[matchIndex];
                        assert.equal(found, shouldFind, "'" + found + "' == '" + shouldFind + "', Line " + (i / div));
                    }
                    else {
                        assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i / div));
                    }
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexInclude', (done) => {
            const regex = re.regexInclude();
            const insOuts = [
                // input-line, match, found-file
                'include   "sound.asm" ', true, "sound.asm",
                '  INCLUDE "src/sound.asm"', true, "src/sound.asm",
                'include   abcd ', false, "",
                'includeX   "sound.asm" ', false, "",

                // For list file
                '6017.R11 00 AF     include   "sound.asm" ', true, "sound.asm",
                '39+ 6017           include   "sound.asm" ', true, "sound.asm",
                '29    0012  D3 FE  include   "sound.asm" ', true, "sound.asm",
                '625++C4D1          include   "sound.asm" ', true, "sound.asm",
                '626++C4D1 FE 10    include   "sound.asm" ', true, "sound.asm",
            ];

            checkResultsMatchFound(regex, insOuts);
            done();
        });


        test('regexModuleStruct', (done) => {
            const regex = re.regexModuleStruct();
            const insOuts = [
                // input-line, match, found-file
                ' module   m', true, "m",
                ' MODULE m', true, "m",
                ' struct m', true, "m",
                'module m', false, "",
                '  module  m.aa.b', true, "m.aa.b",
                ' module   ', false, "",
                ' module', false, "",

                // For list file
                "6017.R11 00 AF     module mod", true, "mod",
                "39+ 6017           module mod", true, "mod",
                "29    0012  D3 FE  module mod", true, "mod",
                "625++C4D1          module mod", true, "mod",
                "626++C4D1 FE 10    module mod", true, "mod",
            ];

            checkResultsMatchFound(regex, insOuts, 2);
            done();
        });

        test('regexEndModuleStruct', (done) => {
            const regex = re.regexEndModuleStruct();
            const insOuts = [
                // input-line, match, found-file
                ' endmodule   ', true,
                ' ENDMODULE ', true,
                ' ends', true,
                'endmodule', false,
                ' endmodule   mm', true,  // Is also found although this is not 100% correct

                // For list file
                "6017.R11 00 AF     endmodule", true,
                "39+ 6017           endmodule ", true,
                "29    0012  D3 FE  endmodule", true,
                "625++C4D1          endmodule ", true,
                "626++C4D1 FE 10    endmodule", true,
            ];

            checkResultsMatch(regex, insOuts);
            done();
        });


        test('regexFuzzyFind 1', (done) => {
            assert.equal("\\w*a", re.regexPrepareFuzzy("a"));
            assert.equal("\\w*a\\w*b\\w*c", re.regexPrepareFuzzy("abc"));
            assert.equal("", re.regexPrepareFuzzy(""));
            done();
        });

        test('regexFuzzyFind 2', (done) => {
            const insOuts = [
                // input-line, search-word, should-match
                "snd", "snd", true,
                "sound", "snd", true,
                "asound", "snd", true,
                "sounds", "snd", true,
                "soun", "snd", false,
                "sounkkd", "snd", true,
            ];

            try {
                // Check the test
                const count = insOuts.length;
                const div = 3;  // Line divider
                assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for (let i = 0; i < count; i += div) {
                    const input = insOuts[i] as string;
                    const searchWordRaw = insOuts[i + 1] as string;

                    // To be tested function:
                    const searchWord = re.regexPrepareFuzzy(searchWordRaw);

                    const regex = new RegExp(searchWord);
                    const shouldMatch = insOuts[i + 2] as boolean;
                    const result = regex.exec(input);
                    if (result) {
                        assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i / div));
                    }
                    else {
                        assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i / div));
                    }
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }

            done();
        });
    });


    suite('RegEx 1 capture', () => {

        function checkResults1Capture(regex: RegExp, insOuts: string[]) {
            try {
                // Check the test
                const count = insOuts.length;
                const div = 3;  // Line divider
                assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for (let i = 0; i < count; i += div) {
                    const input = insOuts[i];
                    const prefix = insOuts[i + 1];
                    const label = insOuts[i + 2];
                    const result = regex.exec(input);
                    if (result) {
                        const foundPrefix = result[1];
                        const foundLabel = result[2];
                        assert.equal(prefix, foundPrefix, "Prefix: '" + prefix + "' == '" + foundPrefix + "', Line " + (i / div) + ": " + input);
                        assert.equal(label, foundLabel, "Label: '" + label + "' == '" + foundLabel + "', Line " + (i / div));
                    }
                    else
                        assert.equal(label, '', "Label (b):'" + label + "' == '', Line " + (i / div));
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexLabelColon', (done) => {
            const regex = re.regexLabelColon();
            const insOuts = [
                // input-line, found-prefix, found-label
                "label1:", "", "label1",
                "label1:  defb 0 ; comment", "", "label1",
                "Label1:", "", "Label1",
                "label_0123456789: ", "", "label_0123456789",
                "l:", "", "l",
                "0l:", "", "",
                "_l: ", "", "_l",
                "label.init: ", "", "label.init",
                "label._init:", "", "label._init",
                "label ", "", "",

                "label", "", "",
                "  label2:", "  ", "label2",
                "  label2: ", "  ", "label2",
                "   label2:defw 898; comm", "   ", "label2",
                "   label2.loop:", "   ", "label2.loop",
                ".label:", "", "",
                " .label:", "", "",
                " .label: ", "", "",

                // For list file
                "6017.R11 00 AF     label:", "6017.R11 00 AF     ", "label",
                "39+ 6017           label:", "39+ 6017           ", "label",
                "29    0012  D3 FE  label:", "29    0012  D3 FE  ", "label",
                "625++C4D1          label:", "625++C4D1          ", "label",
                "626++C4D1 FE 10    label:", "626++C4D1 FE 10    ", "label",
            ];

            checkResults1Capture(regex, insOuts);
            done();
        });


        test('regexLabelWithoutColon', (done) => {
            const regex = re.regexLabelWithoutColon();
            const insOuts = [
                "label1", "", "label1",
                "label1  defb 0 ; comment", "", "label1",
                "Label1", "", "Label1",
                "label_0123456789 ", "", "label_0123456789",
                "l", "", "l",
                "0l", "", "",
                "_l ", "", "_l",
                "label.init ", "", "label.init",
                "label._init", "", "label._init",
                "label ", "", "label",

                "label", "", "label",
                "  label2", "", "",
                "  label2 ", "", "",
                "   label2 defw 898; comm", "", "",
                "   label2.loop", "", "",
                ".label", "", "",
                " .label", "", "",
                " .label ", "", "",
                "label:", "", "",
            ];

            checkResults1Capture(regex, insOuts);
            done();
        });
    });



    // insOuts: search-word, input-line, should-match, found-prefix
    function checkResultsSearchWord(func: (string) => RegExp, insOuts: (string | boolean)[]) {
        try {
            // Check the test
            const count = insOuts.length;
            const div = 4;  // Line divider
            assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
            for (let i = 0; i < count; i += div) {
                const searchWord = insOuts[i];
                const input = insOuts[i + 1] as string;
                const shouldMatch = insOuts[i + 2];
                const prefix = insOuts[i + 3];
                const regex = func(searchWord);
                const result = regex.exec(input);
                if (result) {
                    assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i / div) + ", searched for: '" + searchWord + "' in '" + input + "'");
                    const foundPrefix = result[1];
                    assert.equal(prefix, foundPrefix, "'" + prefix + "' == '" + foundPrefix + "', Prefix of line " + (i / div));
                }
                else {
                    assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i / div) + ", searched for: '" + searchWord + "' in '" + input + "'");
                }
            }
        }
        catch (e) {
            assert.fail("Testcase assertion: " + e);
        }
    }

    suite('RegEx with search-word', () => {

        test('regexLabelColonForWord', (done) => {
            const insOuts = [
                "label", "xxx.label:", true, "",

                // search-word, input-line, should-match, found-prefix
                "label", "label:", true, "",
                "label", "label: ", true, "",
                "label", "label:;", true, "",
                "label", "  label:", true, "  ",
                "label", "   label: ", true, "   ",
                "label", " label:;", true, " ",
                "label", "label", false, "",
                "label", "label ", false, "",
                "label", "label;", false, "",
                "LabelA_0123456789", "LabelA_0123456789:", true, "",

                "_LabelA_0123456789", "_LabelA_0123456789:", true, "",
                "label", "xxx.label:", true, "",
                "label", "_xxx.label:", true, "",
                "label", "0xxx.label:", false, "",
                //"label", ".label:", false, "",    // Required for issue #30: Goto definition to local label not working
                "label", "label.xxx:", false, "",
                "label", "yyy.label.xxx:", false, "",
                "label", "xlabel:", false, "",
                "label", "labely:", false, "",
                "label", "xxx.xlabel:", false, "",
                "label", "xlabel.yyy:", false, "",


                // For list file
                "label", "6017.R11 00 AF     label:", true, "6017.R11 00 AF     ",
                "label", "39+ 6017           label:", true, "39+ 6017           ",
                "label", "29    0012  D3 FE  label:", true, "29    0012  D3 FE  ",
                "label", "625++C4D1          label:", true, "625++C4D1          ",
                "label", "626++C4D1 FE 10    label:", true, "626++C4D1 FE 10    ",
            ];

            checkResultsSearchWord(re.regexLabelColonForWord, insOuts);
            done();
        });


        test('regexLabelWithoutColonForWord', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label", true, "",
                "label", "label ", true, "",
                "label", "label;", true, "",
                "label", "  label", false, "",
                "label", "   label ", false, "",
                "label", " label;", false, "",
                "label", " label", false, "",
                "label", " label ", false, "",
                "label", " label;", false, "",
                "LabelA_0123456789", "LabelA_0123456789", true, "",

                "_LabelA_0123456789", "_LabelA_0123456789", true, "",
                "label", "xxx.label", true, "",
                "label", "_xxx.label", true, "",
                "label", "0xxx.label", false, "",
                //"label", ".label", false, "",   // Required for issue #30: Goto definition to local label not working
                "label", "label.xxx", false, "",
                "label", "yyy.label.xxx", false, "",
                "label", "xlabel", false, "",
                "label", "labely", false, "",
                "label", "xxx.xlabel", false, "",
                "label", "xlabel.yyy", false, "",
                "label", "label:", false, "",
                "label", "label: ", false, "",
                "label", "label:;", false, "",
                "label", "xxx.label:", false, "",
            ];

            checkResultsSearchWord(re.regexLabelWithoutColonForWord, insOuts);
            done();
        });


        test('regexModuleForWord', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "module m", false, "",
                "m", " module m", true, " module ",
                "m", " MODULE m", true, " MODULE ",
                "m", " module x", false, "",
                "Mm_0123456789", "  module Mm_0123456789;", true, "  module ",

                // For list file
                "m", "6017.R11 00 AF     module m", true, "6017.R11 00 AF     module ",
                "m", "39+ 6017           module m", true, "39+ 6017           module ",
                "m", "29    0012  D3 FE  module m", true, "29    0012  D3 FE  module ",
                "m", "625++C4D1          module m", true, "625++C4D1          module ",
                "m", "626++C4D1 FE 10    module m", true, "626++C4D1 FE 10    module ",
            ];

            checkResultsSearchWord(re.regexModuleForWord, insOuts);
            done();
        });


        test('regexMacroForWord', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "macro m", false, "",
                "m", " macro m", true, " macro ",
                "m", " MACRO m", true, " MACRO ",
                "m", " macro x", false, "",
                "Mm_0123456789", "  macro Mm_0123456789;", true, "  macro ",

                // For list file
                "m", "6017.R11 00 AF     macro m", true, "6017.R11 00 AF     macro ",
                "m", "39+ 6017           macro m", true, "39+ 6017           macro ",
                "m", "29    0012  D3 FE  macro m", true, "29    0012  D3 FE  macro ",
                "m", "625++C4D1          macro m", true, "625++C4D1          macro ",
                "m", "626++C4D1 FE 10    macro m", true, "626++C4D1 FE 10    macro ",
            ];

            checkResultsSearchWord(re.regexMacroForWord, insOuts);
            done();
        });


        test('regexStructForWord', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "struct m", false, "",
                "m", " struct m", true, " struct ",
                "m", " STRUCT m", true, " STRUCT ",
                "m", " struct x", false, "",
                "Mm_0123456789", "  struct Mm_0123456789;", true, "  struct ",

                // For list file
                "m", "6017.R11 00 AF     struct m", true, "6017.R11 00 AF     struct ",
                "m", "39+ 6017           struct m", true, "39+ 6017           struct ",
                "m", "29    0012  D3 FE  struct m", true, "29    0012  D3 FE  struct ",
                "m", "625++C4D1          struct m", true, "625++C4D1          struct ",
                "m", "626++C4D1 FE 10    struct m", true, "626++C4D1 FE 10    struct ",
            ];

            checkResultsSearchWord(re.regexStructForWord, insOuts);
            done();
        });


        test('regexAnyReferenceForWord', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label ", true, "",
                "label", " label", true, " ",
                "label", " jr label", true, " jr ",
                "label", " jr label2", false, "",
                "label", " jr zlabel", false, "",

                "label", "  jr nz,label", true, "  jr nz,",
                "label", "  jr nz,label.init", true, "  jr nz,",
                "label", "  jr nz,init.label.l3", true, "  jr nz,init.",
                "label", "  jr nz,init.label", true, "  jr nz,init.",
                "label", "  ld a,(init.label)", true, "  ld a,(init.",

                "label", "  ld a,(ix+init.label)", true, "  ld a,(ix+init.",
                "label", "  ld a,(ix-init.label)", true, "  ld a,(ix-init.",
                "label", "  ld a,(5+init.label)", true, "  ld a,(5+init.",
                "label", "  ld a,(5-init.label*8)", true, "  ld a,(5-init.",
            ];

            checkResultsSearchWord(re.regexAnyReferenceForWord, insOuts);
            done();
        });


        // insOuts: search-word, input-line, number of matches, found1, found2, ...
        function checkResultsSearchWordGlobal(func: (string) => RegExp, insOuts: (string | number)[]) {
            try {
                // Check the test
                const count = insOuts.length;
                let i = 0;
                let lineNumber = 0;
                while (i < count) {
                    const searchWord = insOuts[i++];
                    const input = insOuts[i++] as string;
                    const countMatches = insOuts[i++] as number;
                    const regex = func(searchWord);
                    if (countMatches == 0) {
                        // Assure that there is no match
                        const result = regex.exec(input);
                        assert.equal(result, undefined, "A match was found although no match should be found. Line " + lineNumber + ", searched for: '" + searchWord + "'");
                    }
                    else {
                        // Compare all matches
                        for (let m = 0; m < countMatches; m++) {
                            const prefix = insOuts[i++] as string;
                            const result = regex.exec(input);
                            assert.notEqual(result, undefined, "No match was found although a match should be found. Line " + lineNumber + ", searched for: '" + searchWord + "' (" + m + ")");
                            const foundPrefix = result![1];
                            assert.equal(prefix, foundPrefix, "'" + prefix + "' == '" + foundPrefix + "', Prefix of line " + lineNumber + " (" + m + ")");
                        }
                    }

                    // Next
                    lineNumber++;
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexAnyReferenceForWordGlobal', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label ", 1, "",
                "label", " label", 1, " ",
                "label", " jr label", 1, " jr ",
                "label", " jr label2", 0, "",
                "label", " jr zlabel", 0, "",

                "label", "  jr nz,label", 1, "  jr nz,",
                "label", "  jr nz,label.init", 1, "  jr nz,",
                "label", "  jr nz,init.label.l3", 1, "  jr nz,init.",
                "label", "  jr nz,init.label", 1, "  jr nz,init.",
                "label", "  ld a,(init.label)", 1, "  ld a,(init.",

                "label", "  ld a,(ix+init.label)", 1, "  ld a,(ix+init.",
                "label", "  ld a,(ix-init.label)", 1, "  ld a,(ix-init.",
                "label", "  ld a,(5+init.label)", 1, "  ld a,(5+init.",
                "label", "  ld a,(5-init.label*8)", 1, "  ld a,(5-init.",

                "label", "label: djnz sound.label", 2, "", ": djnz sound.",
            ];

            checkResultsSearchWordGlobal(RenameRegexes.regexAnyReferenceForWordGlobal, insOuts);
            done();
        });
    });






    suite('RegEx with search-word middle, ignore case', () => {

        suite('regexEveryLabelColonForWord', () => {

            test('find label', (done) => {
                const insOuts = [
                    // search-word, input-line, should-match, found-prefix
                    "label", "label:", true, "",
                    "label", "label: ", true, "",
                    "label", "label:;", true, "",
                    "label", "  label:", true, "  ",
                    "label", "   label: ", true, "   ",

                    "label", " label:;", true, " ",
                    "label", "label", false, "",
                    "label", "label ", false, "",
                    "label", "label;", false, "",
                    "LabelA_0123456789", "LabelA_0123456789:", true, "",

                    "_LabelA_0123456789", "_LabelA_0123456789:", true, "",
                    "label", "xxx.label:", true, "xxx.",
                    "label", "_xxx.label:", true, "_xxx.",
                    "label", "0xxx.label:", true, "0xxx.", // Allows more than senseful, i.e. labels don't start with a number.
                    "label", ".label:", true, ".",

                    "label", "label.xxx:", true, "",
                    "label", "yyy.label.xxx:", true, "yyy.",
                    "label", "xlabel:", false, "",
                    "label", "labely:", true, "",
                    "label", "xxx.labely:", true, "xxx.",
                    "label", "xxx.xlabel:", false, "",

                    "label", "xlabel.yyy:", false, "",
                    "\\w*s\\w*n\\w*d", "sound:", true, "",
                    "\\w*s\\w*n\\w*d", "snd:", true, "",
                    "\\w*s\\w*n\\w*d", "xxx.soundaaa:", true, "xxx.",
                    "\\w*s\\w*n\\w*d", "yyy.sound.zzz:", true, "yyy.",

                    "label", "LaBeL:", true, "",

                    "label", "@Label:", true, "@",

                    // List file
                    "label", "  label:", true, "  ",
                    "label", "6017.R11 00 AF     label:", true, "6017.R11 00 AF     ",
                    "label", "39+  6017          label:", true, "39+  6017          ",
                    "label", "7002 00 70         label:", true, "7002 00 70         ",
                    "label", "29    0012  D3 FE  label:", true, "29    0012  D3 FE  ",
                    "label", "625++C4D1          label:", true, "625++C4D1          ",
                    "label", "626++C4D1 FE 10    label:", true, "626++C4D1 FE 10    ",

                    "label", "  @label:", true, "  @",
                    "label", "6017.R11 00 AF     @label:", true, "6017.R11 00 AF     @",
                    "label", "39+  6017          @label:", true, "39+  6017          @",
                    "label", "7002 00 70         @label:", true, "7002 00 70         @",
                    "label", "29    0012  D3 FE  @label:", true, "29    0012  D3 FE  @",
                    "label", "625++C4D1          @label:", true, "625++C4D1          @",
                    "label", "626++C4D1 FE 10    @label:", true, "626++C4D1 FE 10    @",
                ];

                checkResultsSearchWord(CompletionRegexesMock.regexEveryLabelColonForWordForCompletion, insOuts);
                done();
            });


            test('start index', (done) => {
                const regex = CompletionRegexesMock.regexEveryLabelColonForWordForCompletion('fill_memory');

                let match = regex.exec("24 + 600F              fill_memory:");
                // Calculate start index
                assert.equal(re.calcStartIndex(match!), 23);

                match = regex.exec("fill_memory:");
                // Calculate start index
                assert.equal(re.calcStartIndex(match!), 0);
                done();
            });

        });


        test('regexEveryLabelWithoutColonForWordForCompletion', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label", true, "",
                "label", "label ", true, "",
                "label", "label  ", true, "",
                "label", "  label", false, "",
                "label", "   label ", false, "",

                "label", " label  ", false, "",
                "label", " label", false, "",
                "label", " label ", false, "",
                "label", " label  ", false, "",
                "LabelA_0123456789", "LabelA_0123456789", true, "",

                "_LabelA_0123456789", "_LabelA_0123456789", true, "",
                "label", "xxx.label", true, "xxx.",
                "label", "_xxx.label", true, "_xxx.",
                "label", "0xxx.label", false, "",
                "label", ".label", true, ".",

                "label", "label.xxx", true, "",
                "label", "yyy.label.xxx", true, "yyy.",
                "label", "xlabel", false, "",
                "label", "labely", true, "",
                "label", "xxx.xlabel", false, "",

                "label", "xlabel.yyy", false, "",
                "label", "label:", false, "",
                "label", "label: ", false, "",
                "label", "label:;", false, "",
                "label", "xxx.label:", false, "",

                "\\w*s\\w*n\\w*d", "sound", true, "",
                "\\w*s\\w*n\\w*d", "snd", true, "",
                "\\w*s\\w*n\\w*d", "xxx.soundaaa", true, "xxx.",
                "\\w*s\\w*n\\w*d", "yyy.sound.zzz", true, "yyy.",

                "label", "LaBeL", true, "",
            ];

            checkResultsSearchWord(CompletionRegexesMock.regexEveryLabelWithoutColonForWordForCompletion, insOuts);
            done();
        });


        test('regexEveryModuleForWordForCompletion', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "module m", false, "",
                "m", " module m", true, " module ",
                "m", " MODULE m", true, " MODULE ",
                "m", " module x", false, "",
                "Mm_0123456789", "  module Mm_0123456789;", true, "  module ",
                "m", "  module  maaa", true, "  module  ",
                "m", " module m.aaa", true, " module ",
                "m", " module maaa.bb", true, " module ",
                "m", " module ma.b.c", true, " module ",
                "m", " module a.m", false, "",

                // For list file
                "m", "6017.R11 00 AF     module m", true, "6017.R11 00 AF     module ",
                "m", "39+ 6017           module m", true, "39+ 6017           module ",
                "m", "29    0012  D3 FE  module m", true, "29    0012  D3 FE  module ",
                "m", "625++C4D1          module m", true, "625++C4D1          module ",
                "m", "626++C4D1 FE 10    module m", true, "626++C4D1 FE 10    module ",
            ];

            checkResultsSearchWord(CompletionRegexesMock.regexEveryModuleForWordForCompletion, insOuts);
            done();
        });


        test('regexEveryMacroForWordForCompletion', (done) => {
            const insOuts = [
                "m", "macro m", false, "",
                "m", " macro m", true, " macro ",
                "m", " MACRO m", true, " MACRO ",
                "m", " macro x", false, "",
                "Mm_0123456789", "  macro Mm_0123456789;", true, "  macro ",
                "m", "  macro  maaa", true, "  macro  ",
                "m", " macro m.aaa", true, " macro ",
                "m", " macro maaa.bb", true, " macro ",
                "m", " macro ma.b.c", true, " macro ",
                "m", " macro a.m", false, "",

                // For list file
                "m", "6017.R11 00 AF     macro m", true, "6017.R11 00 AF     macro ",
                "m", "39+ 6017           macro m", true, "39+ 6017           macro ",
                "m", "29    0012  D3 FE  macro m", true, "29    0012  D3 FE  macro ",
                "m", "625++C4D1          macro m", true, "625++C4D1          macro ",
                "m", "626++C4D1 FE 10    macro m", true, "626++C4D1 FE 10    macro ",
            ];

            checkResultsSearchWord(CompletionRegexesMock.regexEveryMacroForWordForCompletion, insOuts);
            done();
        });


        test('regexStructForWord', (done) => {  // NOSONAR
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "struct m", false, "",
                "m", " struct m", true, " struct ",
                "m", " STRUCT m", true, " STRUCT ",
                "m", " struct x", false, "",
                "Mm_0123456789", "  struct Mm_0123456789;", true, "  struct ",

                // For list file
                "m", "6017.R11 00 AF     struct m", true, "6017.R11 00 AF     struct ",
                "m", "39+ 6017           struct m", true, "39+ 6017           struct ",
                "m", "29    0012  D3 FE  struct m", true, "29    0012  D3 FE  struct ",
                "m", "625++C4D1          struct m", true, "625++C4D1          struct ",
                "m", "626++C4D1 FE 10    struct m", true, "626++C4D1 FE 10    struct ",
            ];

            checkResultsSearchWord(re.regexStructForWord, insOuts);
            done();
        });


        test('regexAnyReferenceForWord', (done) => {  // NOSONAR
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label ", true, "",
                "label", " label", true, " ",
                "label", " jr label", true, " jr ",
                "label", " jr label2", false, "",
                "label", " jr zlabel", false, "",

                "label", "  jr nz,label", true, "  jr nz,",
                "label", "  jr nz,label.init", true, "  jr nz,",
                "label", "  jr nz,init.label.l3", true, "  jr nz,init.",
                "label", "  jr nz,init.label", true, "  jr nz,init.",
                "label", "  ld a,(init.label)", true, "  ld a,(init.",

                "label", "  ld a,(ix+init.label)", true, "  ld a,(ix+init.",
                "label", "  ld a,(ix-init.label)", true, "  ld a,(ix-init.",
                "label", "  ld a,(5+init.label)", true, "  ld a,(5+init.",
                "label", "  ld a,(5-init.label*8)", true, "  ld a,(5-init.",
            ];

            checkResultsSearchWord(re.regexAnyReferenceForWord, insOuts);
            done();
        });


        // insOuts: search-word, input-line, number of matches, found1, found2, ...
        function checkResultsSearchWordGlobal(func: (string) => RegExp, insOuts: (string | number)[]) {  // NOSONAR
            try {
                // Check the test
                const count = insOuts.length;
                let i = 0;
                let lineNumber = 0;
                while (i < count) {
                    const searchWord = insOuts[i++];
                    const input = insOuts[i++] as string;
                    const countMatches = insOuts[i++] as number;
                    const regex = func(searchWord);
                    if (countMatches == 0) {
                        // Assure that there is no match
                        const result = regex.exec(input);
                        assert.equal(result, undefined, "A match was found although no match should be found. Line " + lineNumber + ", searched for: '" + searchWord + "'");
                    }
                    else {
                        // Compare all matches
                        for (let m = 0; m < countMatches; m++) {
                            const prefix = insOuts[i++] as string;
                            const result = regex.exec(input);
                            assert.notEqual(result, undefined, "No match was found although a match should be found. Line " + lineNumber + ", searched for: '" + searchWord + "' (" + m + ")");
                            const foundPrefix = result![1];
                            assert.equal(prefix, foundPrefix, "'" + prefix + "' == '" + foundPrefix + "', Prefix of line " + lineNumber + " (" + m + ")");
                        }
                    }

                    // Next
                    lineNumber++;
                }
            }
            catch (e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexAnyReferenceForWordGlobal', (done) => {  // NOSONAR
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "label", "label ", 1, "",
                "label", " label", 1, " ",
                "label", " jr label", 1, " jr ",
                "label", " jr label2", 0, "",
                "label", " jr zlabel", 0, "",

                "label", "  jr nz,label", 1, "  jr nz,",
                "label", "  jr nz,label.init", 1, "  jr nz,",
                "label", "  jr nz,init.label.l3", 1, "  jr nz,init.",
                "label", "  jr nz,init.label", 1, "  jr nz,init.",
                "label", "  ld a,(init.label)", 1, "  ld a,(init.",

                "label", "  ld a,(ix+init.label)", 1, "  ld a,(ix+init.",
                "label", "  ld a,(ix-init.label)", 1, "  ld a,(ix-init.",
                "label", "  ld a,(5+init.label)", 1, "  ld a,(5+init.",
                "label", "  ld a,(5-init.label*8)", 1, "  ld a,(5-init.",

                "label", "label: djnz sound.label", 2, "", ": djnz sound.",
            ];

            checkResultsSearchWordGlobal(RenameRegexes.regexAnyReferenceForWordGlobal, insOuts);
            done();
        });
    });


});