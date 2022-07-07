



/**
 * This is a collection of specialized regex-like matchers
 * that should work faster than normal regexes.
 * This is often done with a 2 step approach.
 * A first simple check that should be fast and find strings without
 * matches easily.
 * Then there is a 2nd level which checks for correctness and which could
 * be slower.
 */


/**
 * Does a check for string.indexOf(...) before the regex.
 */
export class RegexIndexOf extends RegExp {

	// The first checked string.
	protected find: string;


	/**
	 * Constructor.
	 * @param find First the check is done with an indexOf(find).
	 * @param regex if indexOf is >= 0 then the regex is evaluated.
	 */
	constructor(find: string, regex: RegExp) {
		super(regex);
		this.find = find;
	}



	/**
	 * Executes the regexes on the string.
	 * @param line The string to check.
	 * @returns If line does not contain 'find' null is returned
	 * Otherwise the regex is evaluated.
	 */

	public exec(line: string): RegExpExecArray | null {
		if (line.indexOf(this.find) < 0)
			return null;
		return super.exec(line);
	}
}


/**
 * Does check a first, simpler regex before the more complicated oe is evaluated.
 */
export class RegexTwo extends RegExp {

	// The first simple regex.
	protected simpleRegex: RegExp;


	/**
	 * Constructor.
	 * @param simpleRegex Is checked first, if no match null is returned.
	 * @param regex Is evaluated is simlpeRegex finds a match.
	 */
	constructor(simpleRegex: RegExp, regex: RegExp) {
		super(regex);
		this.simpleRegex = simpleRegex;
	}



	/**
	 * Executes the regexes on the string.
	 * @param line The string to check.
	 * @returns If line does not contain 'find1' or 'find2' null is returned
	 * Otherwise the regex is evaluated.
	 */

	public exec(line: string): RegExpExecArray | null {
		if (!this.simpleRegex.exec(line))
			return null;
		return super.exec(line);
	}
}
