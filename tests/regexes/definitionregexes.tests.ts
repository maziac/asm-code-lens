import { DefinitionRegexes } from './../../src/regexes/definitionregexes';
import * as assert from 'assert';



suite('DefinitionRegexes', () => {



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

        checkResultsSearchWord(DefinitionRegexes.regexStructForWord, insOuts);
        done();
    });
});
