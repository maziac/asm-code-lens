



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
	 * @returns If one regex do not match null is returned.
	 * If all regexes match the last match is returned.
	 */

	public exec(line: string): RegExpExecArray | null {
		if (line.indexOf(this.find) < 0)
			return null;
		return super.exec(line);
	}
}
