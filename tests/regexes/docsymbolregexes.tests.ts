import {SymbolRegexes} from './../../src/regexes/symbolregexes';
import * as assert from 'assert';



suite('SymbolRegexes', () => {

    function checkResultsMatch(regex: RegExp, insOuts: (string | boolean | undefined)[]) {
        try {
            // Check the test
            const count = insOuts.length;
            const div = 4;  // Line divider
            assert.equal(count % div, 0, "Testcase error: Number of lines in input and output should be equal, otherwise the test is wrong!");
            for (let i = 0; i < count; i += div) {
                const input = insOuts[i] as string;
                const shouldMatch = insOuts[i + 1];
                const result = regex.exec(input);
                if (result) {
                    assert.ok(shouldMatch, "A match was found although no match should be found. Line " + (i / div) + ". In '" + input + "'.");
                }
                else {
                    assert.ok(!shouldMatch, "No match was found although a match should be found. Line " + (i / div) + ". In '" + input + "'.");
                }
                if (result) {
                    // Also check capture groups
                    assert.equal(result[1], insOuts[i + 2], "'" + result[1] + "' == '" + insOuts[i + 2] + "'. In (A) '" + input + "'.");
                    assert.equal(result[2], insOuts[i + 3], "'" + result[2] + "' == '" + insOuts[i + 3] + "'. In (B) '" + input + "'.");
                }
            }
        }
        catch (e) {
            assert.fail("Testcase assertion: " + e);
        }
    }


    test('regexLabelWithAndWithoutColon asm', () => {
        const insOuts = [
            "main:", true, "main:", "main",
            "main", true, "main", "main",
            "M.a.main:", true, "M.a.main:", "M.a.main",
        ];
        const regex = SymbolRegexes.regexLabelWithAndWithoutColon('asm-collection');
        checkResultsMatch(regex, insOuts);
    });

    test('regexLabelWithAndWithoutColon list', () => {
        const insOuts = [
            "# file opened: main.asm", false, "", "",
            "57   8000              main:", true, "main:", "main",
            "57   8000              main", false, "", "",
            "57   8000              M.a.main:", true, "M.a.main:", "M.a.main",
        ];
        const regex = SymbolRegexes.regexLabelWithAndWithoutColon('asm-list-file');
        checkResultsMatch(regex, insOuts);
    });



    test('regexLabelWithColon asm', () => {
        const insOuts = [
            "main:", true, "main:", "main",
            "main", false, "", "",
            "M.a.main:", true, "M.a.main:", "M.a.main",
        ];
        const regex = SymbolRegexes.regexLabelWithColon('asm-collection');
        checkResultsMatch(regex, insOuts);
    });

    test('regexLabelWithColon list', () => {    // NOSONAR
        const insOuts = [
            "57   8000              main:", true, "main:", "main",
            "57   8000              main", false, "", "",
            "57   8000              M.a.main:", true, "M.a.main:", "M.a.main",
        ];
        const regex = SymbolRegexes.regexLabelWithColon('asm-list-file');
        checkResultsMatch(regex, insOuts);
    });



    test('regexLabelWithoutColon (only asm)', () => {
        const insOuts = [
            "main:", false, "", "",
            "main", true, "main", undefined,
            "@main", true, "@main", undefined,
            "@M.a.main", true, "@M.a.main", undefined,
            "M.a.main:", false, "", "",
            "@M.a.main:", false, "", "",
        ];
        const regex = SymbolRegexes.regexLabelWithoutColon();
        checkResultsMatch(regex, insOuts);
    });



    test('regexModuleLabel', () => {
        const insOuts = [
            "label:  MODULE TestSuite_ClearScreen ", true, "MODULE TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "  MODULE TestSuite_ClearScreen ", true, "MODULE TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "  MODULE a.b._c", true, "MODULE a.b._c", "a.b._c",
            "   ", false, "", "",
            "   ENDMODULE", true, "ENDMODULE", undefined,

            " 23+  60D5   MODULE TestSuite_ClearScreen ", true, "MODULE TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "24+  60D", false, "", "",
            "92+  6180   ENDMODULE", true, "ENDMODULE", undefined,
        ];
        const regex = SymbolRegexes.regexModuleLabel();
        checkResultsMatch(regex, insOuts);
    });


    test('regexStructLabel', () => {
        const insOuts = [
            "label:  STRUCT TestSuite_ClearScreen ", true, "STRUCT TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "  STRUCT TestSuite_ClearScreen ", true, "STRUCT TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "  STRUCT a.b._c", true, "STRUCT a.b._c", "a.b._c",
            "   ", false, "", "",
            "   ENDS", true, "ENDS", undefined,

            " 23+  60D5   STRUCT TestSuite_ClearScreen ", true, "STRUCT TestSuite_ClearScreen", "TestSuite_ClearScreen",
            "24+  60D", false, "", "",
            "92+  6180   ENDS", true, "ENDS", undefined,
        ];
        const regex = SymbolRegexes.regexStructLabel();
        checkResultsMatch(regex, insOuts);
    });


    test('regexConst', () => {
        const insOuts = [
            "  EQU aa.b.c ", true, "EQU", "aa.b.c ",
            "label:  EQU aa.b.c ", true, "EQU", "aa.b.c ",
            "  ", false, "", "",

            " 23+  60D5   label:EQU aa.b.c ", true, "EQU", "aa.b.c ",
            " 23+  60D5   EQU aa.b.c ", true, "EQU", "aa.b.c ",
            "24+  60D", false, "", "",
        ];
        const regex = SymbolRegexes.regexConst();
        checkResultsMatch(regex, insOuts);
    });


    test('regexData', () => {
        const insOuts = [
            "  DEFB abcf, h, 0 ", true, "DEFB", "abcf, h, 0 ",
            "label:  DEFW xxyy ", true, "DEFW", "xxyy ",
            "  DEFD abcf, h, 0 ", true, "DEFD", "abcf, h, 0 ",
            "  DEFG abcf, h, 0 ", true, "DEFG", "abcf, h, 0 ",
            "  DEFH abcf, h, 0 ", true, "DEFH", "abcf, h, 0 ",
            "  DEFM abcf, h, 0 ", true, "DEFM", "abcf, h, 0 ",
            "  DEFS abcf, h, 0", true, "DEFS", "abcf, h, 0",

            "  DB abcf, h, 0 ", true, "DB", "abcf, h, 0 ",
            "label:  DW xxyy ", true, "DW", "xxyy ",
            "  DD abcf, h, 0 ", true, "DD", "abcf, h, 0 ",
            "  DG abcf, h, 0 ", true, "DG", "abcf, h, 0 ",
            "  DH abcf, h, 0 ", true, "DH", "abcf, h, 0 ",
            "  DM abcf, h, 0 ", true, "DM", "abcf, h, 0 ",
            "  DS abcf, h, 0", true, "DS", "abcf, h, 0",


            " 23+  60D5   label:DEFB  some", true, "DEFB", "some",
            " 23+  60D5   DEFB some ", true, "DEFB", "some ",
            " 23+  60D5   DS some ", true, "DS", "some ",
            "24+  60D", false, "", "",
        ];
        const regex = SymbolRegexes.regexData();
        checkResultsMatch(regex, insOuts);
    });
});
