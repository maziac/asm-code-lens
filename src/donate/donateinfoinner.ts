import {GlobalStorage} from '../globalstorage';
import {PackageInfo} from '../whatsnew/packageinfo';


/**
 * These are the inner functions.
 * I.e. the functions that can be unit tested.
 * I.e. without 'vscode'.
 */
export class DonateInfoInner {
	// Will be set to false if the donate info was shown once.
	protected static evaluateDonateTime: number | undefined = undefined;

	// The time until when the donation info will be shown
	protected static donateEndTime: number | undefined = undefined;

	// Global storage properties
	protected static VERSION_ID = 'version';
	protected static DONATE_TIME_ID = 'donateTimeId';


	/**
	 * This function is used to display the donation info message.
	 * Will be overwritten with vscode.window.showErrorMessage.
	 * @param message The text to show.
	 * @param items The items to choose from.
	 */
	public static async showInfoMessage(message: string, ...items: string[]): Promise<string> {
		// Overwrite
		return '';
	}


	/**
	 * Opens a webview with donation information.
	 */
	public static openDonateWebView() {
		// Overwrite
	}


	/**
	 * Normally returns Date.now().
	 * But can be overwritten for unit tests.
	 */
	protected static now(): number {
		return Date.now();
	}


	/**
	 * Checks the version number.
	 * If a new (different) version has been installed the DONATE_TIME_ID is set to undefined.
	 * (To start a new timing.)
	 * Is called at the start of the extension (before checkDonateInfo).
	 */
	public static checkVersion() {
		// Load data from extension storage
		const previousVersion = GlobalStorage.Get<string>(this.VERSION_ID)!;
		const currentVersion = PackageInfo.extension.packageJSON.version;

		// Check if version changed: "major", "minor" and "patch"
		if (currentVersion != previousVersion) {
			// Yes, remove the previous donate time
			GlobalStorage.Set(this.DONATE_TIME_ID, undefined);
		}

		// Check if already donated
		this.donatedPreferencesChanged();
	}


	public static async checkDonateInfo() {
		// Check if enabled
		if (this.evaluateDonateTime != undefined &&
			this.now() > this.evaluateDonateTime) {
			// Evaluate only once per day or activation.
			this.evaluateDonateTime = this.now() + this.daysInMs(1);
			// Check if time already set
			if (this.donateEndTime == undefined) {
				this.donateEndTime = GlobalStorage.Get<number>(this.DONATE_TIME_ID);
				if (this.donateEndTime == undefined) {
					this.donateEndTime = this.now() + this.daysInMs(14);
					GlobalStorage.Set(this.DONATE_TIME_ID, this.donateEndTime);
				}
			}
			if (this.now() < this.donateEndTime) {
				// Time not elapsed yet.
				// Show info as error text (warning and info text goes away by itself after a short timeout)
				const selected = await this.showInfoMessage("If you use 'ASM Code Lens' regularly please support the project. Every little donation helps keeping the project running.", "Not now", "Yes, please. I want to show my support.");
				if (selected?.toLowerCase().startsWith('yes')) {
					// Re-direct to donation page
					this.openDonateWebView();
				}
			}
			else {
				// Stop evaluating.
				this.evaluateDonateTime = undefined;
			}
		}
	}


	/**
	 * Called if user changed the 'donated' preferences.
	 */
	public static donatedPreferencesChanged() {
		// Get donated state
		const configuration = PackageInfo.getConfiguration();
		const donated = configuration.get<boolean>('donated');
		if (donated) {
			// Stop donation info (if any)
			this.evaluateDonateTime = undefined;
		}
		else {
			// Start evaluation
			this.evaluateDonateTime = this.now();
		}
	}


	/**
	 * Returns the number of days in ms.
	 */
	protected static daysInMs(days: number) {
		/*
		if (days == 1)
			return 1000 * 20;
		else
			return 1000 * 60;
			*/
		return days * 24 * 60 * 60 * 1000;
	}
}
