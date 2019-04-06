

import * as assert from 'assert';
import * as re from '../src/regexes';
import { AssertionError } from 'assert';
//import * as path from 'path';
//const fs = require('fs-extra');


suite('RegExes', () => {

    suite('RegEx 1 capture', () => {

        function checkResults1Capture(regex: RegExp, insOuts: string[]) {
            try {
                // Check the test
                const count = insOuts.length;
                assert.equal(count % 2, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for(let i=0; i<count; i+=2) {
                    const input = insOuts[i];
                    const output = insOuts[i+1];
                    const result = regex.exec(input);
                    if(result) {
                        const found = result[1];
                        assert.equal(output, found, "'" + output + "' == '" + input + "', Line " + (i/2));
                    }
                    else 
                        assert.equal(output, '', "'" + output + "' == '" + input + "', Line " + (i/2));
                }
            }
            catch(e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexLabelColon', (done) => {
            const regex = re.regexLabelColon();
            const insOuts = [
                "label1:", "label1",
                "label1:  defb 0 ; comment", "label1",
                "Label1:", "Label1",
                "label_0123456789: ", "label_0123456789",
                "l:", "l",
                "0l:", "",
                "_l: ", "_l",
                "label.init: ", "label.init",
                "label._init:", "label._init",
                "label ", "",
                
                "label", "",
                "  label2:", "label2",
                "  label2: ", "label2",
                "   label2:defw 898; comm", "label2",
                "   label2.loop:", "label2.loop",
                ".label:", "",
                " .label:", "",
                " .label: ", "",
                ];

            checkResults1Capture(regex, insOuts);
            done();
        });


        test('regexLabelWithoutColon', (done) => {
            const regex = re.regexLabelWithoutColon();
            const insOuts = [
                "label1", "label1",
                "label1  defb 0 ; comment", "label1",
                "Label1", "Label1",
                "label_0123456789 ", "label_0123456789",
                "l", "l",
                "0l", "",
                "_l ", "_l",
                "label.init ", "label.init",
                "label._init", "label._init",
                "label ", "label",

                "label", "label",
                "  label2", "",
                "  label2 ", "",
                "   label2 defw 898; comm", "",
                "   label2.loop", "",
                ".label", "",
                " .label", "",
                " .label ", "",
                ];

            checkResults1Capture(regex, insOuts);
            done();
        });
    });


    suite('RegEx with search-word', () => {

        // insOuts: search-word, input-line, should-match, found-prefix
        function checkResultsSearchWord(func: (string) => RegExp, insOuts: (string|boolean)[]) {
            try {
                // Check the test
                const count = insOuts.length;
                const div = 4;  // Line divider
                assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
                for(let i=0; i<count; i+=div) {
                    const searchWord = insOuts[i];
                    const input = insOuts[i+1] as string;
                    const shouldMatch = insOuts[i+2];
                    const prefix = insOuts[i+3];
                    const regex = func(searchWord);
                    const result = regex.exec(input);
                    if(result) {
                        assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i/div) + ", searched for: '" + searchWord + "'");
                        const foundPrefix = result[1];
                        assert.equal(prefix, foundPrefix, "'" + prefix + "' == '" + foundPrefix + "', Prefix of line " + (i/div));
                    }
                    else {
                        assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i/div) + ", searched for: '" + searchWord + "'");
                    }
                }
            }
            catch(e) {
                assert.fail("Testcase assertion: " + e);
            }
        }

        test('regexLabelColonForWord', (done) => {
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
                "label", "xxx.label:", true, "",
                "label", "label.xxx:", false, "",
                "label", "yyy.label.xxx:", false, "",
                "label", "xlabel:", false, "",
                "label", "labely:", false, "",
                "label", "xxx.xlabel:", false, "",
                "label", "xlabel.yyy:", false, "",
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
                ];

            checkResultsSearchWord(re.regexStructForWord, insOuts);
            done();
        });
    });


});