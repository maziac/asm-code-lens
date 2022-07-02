
import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {FuncCache} from './funccache';
import {PackageInfo} from './whatsnew/packageinfo';

/**
 * The known language IDs.
 */
export type AllowedLanguageIds = 'asm-collection' | 'asm-list-file';


/**
 * Class the encapsulates the caching of the language information.
 */

export class LanguageId {

	protected static asmCollectionCache = new FuncCache<string>(10000, () => {
		return LanguageId._getGlobalIncludeForLanguageId('asm-collection');
	});

	protected static asmFileListCache = new FuncCache<string>(10000, () => {
		return LanguageId._getGlobalIncludeForLanguageId('asm-list-file');
	});


	/**
	 * The function wraps _getGlobalIncludeForLanguageId to cache it for a little time.
	 * E.g. for 10 secs.
	 * As the function is called quite often, this increases the overall performance.
	 * @parameter languageId Either "asm-collection" or "asm-file-list".
	 * @returns  E.g. "** /*.{asm, inc, s}"
	 */
	public static getGlobalIncludeForLanguageId(languageId: AllowedLanguageIds): string {
		if (languageId == 'asm-collection')
			return LanguageId.asmCollectionCache.getData();
		if (languageId == 'asm-list-file')
			return LanguageId.asmFileListCache.getData();
		// Should not reach here
		assert(false, 'languageId = ' + languageId + ' unknown.');
	}

	/**
	 * The function returns the glob for a given language ID.
	 * It takes the list for associated files from package.json.
	 * Then it adds files from "files.associations" added by the user and
	 * it removes files that the user assigned otherwise.
	 * The remaining list is returned as glob.
	 * @parameter languageId Either "asm-collection" or "asm-file-list".
	 * @returns  E.g. "** /*.{asm, inc, s}"
	 */
	protected static _getGlobalIncludeForLanguageId(languageId: AllowedLanguageIds): string {
		// Package json
		const pckgJson = PackageInfo.extension.packageJSON;
		const languages = pckgJson.contributes.languages;
		const exts: string[] = [];
		for (const lang of languages) {
			if (lang.id == languageId) {
				// Use the extensions defined for the language
				exts.push(...lang.extensions.map(ext => ext.substring(1)));
				break;
			}
		}

		// User's file associations
		//const files = vscode.workspace.getConfiguration("files");// as any as Map<string, string>;
		const filesAssociations = vscode.workspace.getConfiguration("files.associations");
		// Make iterable
		const iterAssocs = Object.entries(filesAssociations);
		// Loop (contains also function entries)
		for (const [ext, lang] of iterAssocs) {
			if (typeof lang == 'string') { // Skip functions
				// remove *
				const onlyExt = path.extname(ext).substring(1);
				if (lang == languageId) {
					// Add
					exts.push(onlyExt);
				}
				else {
					const k = exts.indexOf(onlyExt);
					if (k >= 0) {
						// Remove
						exts.splice(k, 1);
					}
				}
			}
		}

		// Create glob string
		const glob = '**/*.{' + exts.join(',') + '}';
		return glob;    // E.g. "**/*.{asm,inc,s}"
	}
}
