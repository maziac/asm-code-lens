export class Version {
	/**
	 * Checks if a version is newer.
	 * It is newer if major or minor values are bigger.
	 * The patch level is irrelevant.
	 * @param currentVersion The current version.
	 * @param prevVersion The previous version.
	 * @returns E.g. true for isNewVersion('1.2.0', 1.1.9'), false for isNewVersion('1.1.10', '1.1.9').
	 * If currentVersion is undefined returns false.
	 * if prevVersion is undefined returns true.
	 */
	public static isNewVersion(currentVersion: string, prevVersion: string) {
		try {
			if (!currentVersion)
				return false;
			// Convert current version to numbers
			const cv = currentVersion.split('.');
			if (cv.length < 2)
				return false;	// Wrong format

			// Convert prev version
			if (!prevVersion)
				return true;
			// Convert prev version to numbers
			const pv = prevVersion.split('.');
			if (pv.length < 2)
				return true;	// Wrong format

			// Compare
			if (parseInt(cv[0]) > parseInt(pv[0]))
				return true;	// Major number is bigger
			if (parseInt(cv[1]) > parseInt(pv[1]))
				return true;	// Minor number is bigger
			// Nor major nor minor number is bigger
			return false;
		}
		catch {
			// Some error in format
			return false;
		}
	}

}
