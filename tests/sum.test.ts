import {describe, expect, test} from '@jest/globals';
import {CommandsRegexes} from '../src/regexes/commandsregexes';


function checkResultsMatch(regex: RegExp, insOuts: (string | boolean)[]) {
	try {
		// Check the test
		const count = insOuts.length;
		const div = 2;  // Line divider
		expect(count % div).toBe(0);
		for (let i = 0; i < count; i += div) {
			const input = insOuts[i] as string;
			const shouldMatch = insOuts[i + 1];
			const result = regex.exec(input);
			if (result) {
				expect(shouldMatch).toBe(true);
			}
			else {
				expect(shouldMatch).toBe(false);
			}
		}
	}
	catch (e) {
		expect(false).toBe(true);
	}
}



describe('sum module', () => {
	test('a', () => {
		expect(1).toBe(3);
	});
	test('b', () => {
		expect(3).toBe(3);
	});



	test('regexLabelEquOrMacro asm', () => {
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
	});


});