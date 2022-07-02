

// TODO Delete file/class.

/**
 * The regexes have grown more complex with asm-code-lens >= 2.0 because
 * also list files are supported now.
 * Overall the execution of regexes would have become 4 times slower.
 * Therefore a different way to handle regexes was implemented.
 *
 * The idea behind it is that most of the time the regexes anyway fail.
 * I.e. just for a small portion of lines the regex would recognize a label
 * or whatever is searched.
 * The regex match is therefore broken down in 2 steps:
 * 1. A simple and fast regex is run which already sorts out about 90% of the case.
 * 2. A 2nd (slow) regex is executed that more exactly matches the searched statement.
 *
 * Although the 2nd regex is slow the overall algorithm is faster (and
 * should be also faster as in < 2.0) as the majority of checks is done with the fast regex.
 *
 * The implementation works with an array of regexes although most probably
 * only 2 regexes will be used.
 * If a regex does not match the algorithm immediately returns.
 * If all match the result of the last regex is returned.
 * I.e. the previous (faster) regexes do not have to and should not
 * include any captures.
 */
export class FastRegex {

	// The array of regexes.
	public regexes: RegExp[] = [];


	/**
	 * Adds a new regex to the end of the list.
	 * @param regex The new regex.
	 */
	public push(regex: RegExp) {
		this.regexes.push(regex);
		this.regex = regex;
	}
	protected regex;


	/**
	 * Executes the regexes on the string.
	 * @param line The string to check.
	 * @returns If one regex do not match null is returned.
	 * If all regexes match the last match is returned.
	 */

	public exec(line: string): RegExpExecArray | null {
		if (line.indexOf(':') < 0)
			return null;
		return this.regexes[1].exec(line);
		//return this.regex.exec(line);
	}
	public exec4(line: string): RegExpExecArray | null {
		return this.regexes[0].exec(line) || this.regexes[1].exec(line);
		//return this.regex.exec(line);
	}

	public exec3(line: string): RegExpExecArray | null {
		let match: RegExpExecArray | null = null;
		//for (const regex of this.regexes) {
		for (let i = 0; i >= 0; i--) {
			const regex = this.regexes[i];
			// Check for a match
			match = regex.exec(line);
			if (!match)
				return null;
		}
		return match;	// Can be null
	}
}
