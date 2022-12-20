import * as assert from 'assert';
import {CommandsRegexes} from '../../src/regexes/commandsregexes';



describe('CommandsRegexes', () => {

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


    test('regexLabelEquOrMacro asm', (done) => {
        const regex = CommandsRegexes.regexLabelEquOrMacro();
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
        ];

        checkResultsMatch(regex, insOuts);
        done();
    });

    test('regexLabelEquOrMacro list', (done) => {
        const regex = CommandsRegexes.regexLabelEquOrMacro();
        const insOuts = [
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

});
