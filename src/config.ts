
 /**
  * Used to pass user preferences settings between functions.
  */
interface Config {
	// The root folder of the workspace
	rootFolder: string;

	// true if labels with colons should be searched.
	labelsWithColons: boolean;

	//  true if labels without colons should be searched.
	labelsWithoutColons: boolean;

	// A list of strings with words to exclude from the found labels list.
	labelsExcludes: string[];
}

