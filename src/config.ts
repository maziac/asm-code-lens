import {PackageInfo} from "./whatsnew/packageinfo";

 /**
  * Used to pass user preferences settings between functions.
  */
export interface Config {
	// The root folder of the workspace
	rootFolder: string;

	// true if labels with colons should be searched.
	labelsWithColons: boolean;

	//  true if labels without colons should be searched.
	labelsWithoutColons: boolean;

	// A list of strings with words to exclude from the found labels list.
	labelsExcludes: string[];
}



/**
 * Returns the current config, i.e. the user preferences.
 * Returns also the rootFolder, but this is not set i.e. ''.
 */
export function getLabelsConfig(): Config {
	// Get some settings.
	const settings = PackageInfo.getConfiguration();
	let labelsWithColons = true;
	let labelsWithoutColons = true;
	const labelsColon = (settings.get<string>('labels.colon') || '').toLowerCase();
	if (labelsColon.startsWith('without '))
		labelsWithColons = false;
	else if (labelsColon.startsWith('with '))
		labelsWithoutColons = false;
	const labelsExcludesString = settings.get<string>('labels.excludes') || '';
	const labelsExcludes = labelsExcludesString.toLowerCase().split(';');
	const config: Config = {
		rootFolder: '',
		labelsWithColons,
		labelsWithoutColons,
		labelsExcludes
	};
	return config;
}
