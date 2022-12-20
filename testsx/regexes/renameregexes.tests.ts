import { RenameRegexes } from '../../src/regexes/renameregexes';
import * as assert from 'assert';



suite('RenameRegexes', () => {

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


    test('regexAnyReferenceForWordGlobal', () => {  // NOSONAR
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
    });
});
