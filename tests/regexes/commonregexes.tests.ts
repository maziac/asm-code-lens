import { AllowedLanguageIds } from './../../src/languageId';
import * as assert from 'assert';
import {CommonRegexes} from '../../src/regexes/commonregexes';
import {CompletionRegexes} from './../../src/regexes/completionregexes';


// For access to protected functions.
const CompletionRegexesMock = CompletionRegexes as any;


suite('CommonRegexes', () => {

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

        test('regexInclude asm', (done) => {
            const regex = CommonRegexes.regexInclude();
            const insOuts = [
                // input-line, match, found-file
                'include   "sound.asm" ', true, "sound.asm",
                '  INCLUDE "src/sound.asm"', true, "src/sound.asm",
                'include   abcd ', false, "",
                'includeX   "sound.asm" ', false, "",
            ];

            checkResultsMatchFound(regex, insOuts);
            done();
        });


        test('regexInclude list', (done) => {
            const regex = CommonRegexes.regexInclude(); // TODO: Check regex if really independent
            const insOuts = [
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


        test('regexModuleStruct asm', (done) => {
            const regex = CommonRegexes.regexModuleStruct();
            const insOuts = [
                // input-line, match, found-file
                ' module   m', true, "m",
                ' MODULE m', true, "m",
                ' struct m', true, "m",
                'module m', false, "",
                '  module  m.aa.b', true, "m.aa.b",
                ' module   ', false, "",
                ' module', false, "",
            ];

            checkResultsMatchFound(regex, insOuts, 2);
            done();
        });

        test('regexModuleStruct list', (done) => {
            const regex = CommonRegexes.regexModuleStruct();
            const insOuts = [
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

        test('regexEndModuleStruct asm', (done) => {
            const regex = CommonRegexes.regexEndModuleStruct();
            const insOuts = [
                // input-line, match, found-file
                ' endmodule   ', true,
                ' ENDMODULE ', true,
                ' ends', true,
                'endmodule', false,
                ' endmodule   mm', true,  // Is also found although this is not 100% correct
            ];

            checkResultsMatch(regex, insOuts);
            done();
        });

        test('regexEndModuleStruct list', (done) => {
            const regex = CommonRegexes.regexEndModuleStruct();
            const insOuts = [
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
            assert.equal("\\w*a", CommonRegexes.regexPrepareFuzzy("a"));
            assert.equal("\\w*a\\w*b\\w*c", CommonRegexes.regexPrepareFuzzy("abc"));
            assert.equal("", CommonRegexes.regexPrepareFuzzy(""));
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
                    const searchWord = CommonRegexes.regexPrepareFuzzy(searchWordRaw);

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

        test('regexLabelColon asm', (done) => {
            const regex = CommonRegexes.regexLabelColon("asm-collection");
            const insOuts = [
                // input-line, found-prefix, found-label
                "label1:", "", "label1",
                "LABEL1:", "", "LABEL1",
                "label1:  defb 0 ; comment", "", "label1",
                "Label1:", "", "Label1",
                "label_0123456789: ", "", "label_0123456789",
                "l:", "", "l",
                "0l:", "", "",
                "_l: ", "", "_l",
                "label.init: ", "", "label.init",
                "_LABEL.INIT_: ", "", "_LABEL.INIT_",
                "label._init:", "", "label._init",
                "label ", "", "",

                "label", "", "",
                "@label2:", "@", "label2",
                "label2: ", "", "label2",
                " label2: ", "", "",
                "label2:defw 898; comm", "", "label2",
                "label2.loop:", "", "label2.loop",
                ".label:", "", "",
                " .label:", "", "",
            ];

            checkResults1Capture(regex, insOuts);
            done();
        });


        test('regexLabelColon list', (done) => {
            const regex = CommonRegexes.regexLabelColon("asm-list-file");
            const insOuts = [
                // For list file
                "6017.R11 00 AF     label:", "6017.R11 00 AF     ", "label",
                "6017.R11 00 AF     LABEL:", "6017.R11 00 AF     ", "LABEL",
                "39+ 6017           label:", "39+ 6017           ", "label",
                "29    0012  D3 FE  label:", "29    0012  D3 FE  ", "label",
                "625++C4D1          label:", "625++C4D1          ", "label",
                "626++C4D1 FE 10    label:", "626++C4D1 FE 10    ", "label",
                "626++C4D1 FE 10    @label:", "626++C4D1 FE 10    @", "label",
                "626++C4D1 FE 10    label.la:", "626++C4D1 FE 10    ", "label.la",
                "626++C4D1 FE 10    _LABEL.LA_:", "626++C4D1 FE 10    ", "_LABEL.LA_",
                "626++C4D1 FE 10    .la:", "", "",
            ];

            checkResults1Capture(regex, insOuts);
            done();
        });


        test('regexLabelWithoutColon', (done) => {
            const regex = CommonRegexes.regexLabelWithoutColon();
            const insOuts = [
                "label1", "", "label1",
                "LABEL1", "", "LABEL1",
                "label1  defb 0 ; comment", "", "label1",
                "Label1", "", "Label1",
                "label_0123456789 ", "", "label_0123456789",
                "l", "", "l",
                "0l", "", "",
                "_l ", "", "_l",
                "label.init ", "", "label.init",
                "_LABEL.INIT_ ", "", "_LABEL.INIT_",
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
    function checkResultsSearchWord(func: (string, languageId?) => RegExp, insOuts: (string | boolean)[], languageId: AllowedLanguageIds) {
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
                const regex = func(searchWord, languageId);
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

        test('regexLabelColonForWord asm', (done) => {
            const insOuts = [
                "label", "xxx.label:", true, "",

                // search-word, input-line, should-match, found-prefix
                "label", "label:", true, "",
                "label", "label: ", true, "",
                "label", "label:;", true, "",
                "label", "  label:", false, "  ",
                "label", "   label: ", false, "   ",
                "label", " label:;", false, " ",
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
            ];

            checkResultsSearchWord(CommonRegexes.regexLabelColonForWord, insOuts, 'asm-collection');
            done();
        });

        test('regexLabelColonForWord list', (done) => {
            const insOuts = [
                 // For list file
                "label", "6017.R11 00 AF     label:", true, "6017.R11 00 AF     ",
                "label", "39+ 6017           label:", true, "39+ 6017           ",
                "label", "29    0012  D3 FE  label:", true, "29    0012  D3 FE  ",
                "label", "625++C4D1          label:", true, "625++C4D1          ",
                "label", "626++C4D1 FE 10    label:", true, "626++C4D1 FE 10    ",
            ];

            checkResultsSearchWord(CommonRegexes.regexLabelColonForWord, insOuts, 'asm-list-file');
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

            checkResultsSearchWord(CommonRegexes.regexLabelWithoutColonForWord, insOuts, 'asm-collection');
            done();
        });


        test('regexModuleForWord asm', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "module m", false, "",
                "m", " module m", true, " module ",
                "m", " MODULE m", true, " MODULE ",
                "m", " module x", false, "",
                "Mm_0123456789", "  module Mm_0123456789;", true, "  module ",
            ];

            checkResultsSearchWord(CommonRegexes.regexModuleForWord, insOuts, 'asm-collection');
            done();
        });

        test('regexModuleForWord list', (done) => {
            const insOuts = [
                // For list file
                "m", "6017.R11 00 AF     module m", true, "6017.R11 00 AF     module ",
                "m", "39+ 6017           module m", true, "39+ 6017           module ",
                "m", "29    0012  D3 FE  module m", true, "29    0012  D3 FE  module ",
                "m", "625++C4D1          module m", true, "625++C4D1          module ",
                "m", "626++C4D1 FE 10    module m", true, "626++C4D1 FE 10    module ",
            ];

            checkResultsSearchWord(CommonRegexes.regexModuleForWord, insOuts, 'asm-list-file');
            done();
        });


        test('regexMacroForWord asm', (done) => {
            const insOuts = [
                // search-word, input-line, should-match, found-prefix
                "m", "macro m", false, "",
                "m", " macro m", true, " macro ",
                "m", " MACRO m", true, " MACRO ",
                "m", " macro x", false, "",
                "Mm_0123456789", "  macro Mm_0123456789;", true, "  macro ",
            ];

            checkResultsSearchWord(CommonRegexes.regexMacroForWord, insOuts, 'asm-collection');
            done();
        });

        test('regexMacroForWord list', (done) => {
            const insOuts = [
                // For list file
                "m", "6017.R11 00 AF     macro m", true, "6017.R11 00 AF     macro ",
                "m", "39+ 6017           macro m", true, "39+ 6017           macro ",
                "m", "29    0012  D3 FE  macro m", true, "29    0012  D3 FE  macro ",
                "m", "625++C4D1          macro m", true, "625++C4D1          macro ",
                "m", "626++C4D1 FE 10    macro m", true, "626++C4D1 FE 10    macro ",
            ];

            checkResultsSearchWord(CommonRegexes.regexMacroForWord, insOuts, 'asm-list-file');
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

            checkResultsSearchWord(CommonRegexes.regexAnyReferenceForWord, insOuts, 'asm-collection');
            checkResultsSearchWord(CommonRegexes.regexAnyReferenceForWord, insOuts, 'asm-list-file');
            done();
        });
    });


    test('start index', (done) => {
        const regex = CompletionRegexesMock.regexEveryLabelColonForWord('fill_memory');

        let match = regex.exec("24 + 600F              fill_memory:");
        // Calculate start index
        assert.equal(CommonRegexes.calcStartIndex(match), 23);

        match = regex.exec("fill_memory:");
        // Calculate start index
        assert.equal(CommonRegexes.calcStartIndex(match), 0);
        done();
    });

});