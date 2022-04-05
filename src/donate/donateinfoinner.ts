/**
 * These are the inner functions.
 * I.e. the functions that can be unit tested.
 * I.e. without 'vscode'.
 *
 * Use this.enableDonationInfo = false to disable the DonationInfo nag screen.
 */
export class DonateInfoInner {

	// To disable the DonationInfo set this to false.
	protected static enableDonationInfo = true;

	// Will be set to false if the donate info was shown once.
	protected static evaluateDonateTime: number | undefined = undefined;

	// The time until when the donation info will be shown
	protected static donateEndTime: number | undefined = undefined;


	/**
	 * This function is used to display the donation info message.
	 * Will be overwritten with vscode.window.showErrorMessage.
	 * @param message The text to show.
	 * @param items The items to choose from.
	 */
	public static async showInfoMessage(message: string, ...items: string[]): Promise<string | undefined> {
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
	 * Returns the previous version, normally from GlobalStorage
	 * but here in a function to override for the unit tests.
	 * @returns E.g. "2.3.5"
	 */
	protected static getPreviousVersion(): string {
		// Override
		return '';
	}


	/**
	 * Returns the current version, normally from PackageInfo
	 * but here in a function to override for the unit tests.
	 * @returns E.g. "2.3.5"
	 */
	protected static getCurrentVersion(): string {
		// Override
		return '';
	}


	/**
	 * @returns The donation time. Normally from GlobalStorage but also used by unit tests.
	 */
	protected static getDonationTime(): number | undefined{
		// Override
		return undefined;
	}


	/**
	 * Sets the donation time until when the nag screen will be shown.
	 * Should be 14 days into the future after new version ahs been installed.
	 * @param _time After this time the nag screen is not shown anymore. E.g Date.now() + 14 days.
	 */
	protected static setDonationTime(_time: number | undefined) {
		// Override
	}


	/**
	 * Override for unit tests or by real 'get' function.
	 * @returns Returns the state of the 'donated' flag in the asm-code-lens preferences.
	 */
	protected static getDonatedPref(): boolean {
		// Override
		return false;
	}


	/**
	 * Checks the version number.
	 * If a new (different) version has been installed the donation time is set to undefined.
	 * (To start a new timing.)
	 * Is called at the start of the extension (before checkDonateInfo).
	 */
	public static checkVersion() {
		// Load data from extension storage
		const previousVersion = this.getPreviousVersion();
		const currentVersion = this.getCurrentVersion();

		// Check if version changed: "major", "minor" and "patch"
		if (currentVersion != previousVersion) {
			// Yes, remove the previous donate time
			this.setDonationTime(undefined);
		}

		// Check if already donated
		this.donatedPreferencesChanged();
	}


	/**
	 * Called if user changed the 'donated' preferences.
	 * If donated then 'evaluateDonateTime' is set to undefined which stops nagging.
	 * If not donated 'evaluateDonateTime' is set to current time.
	 */
	public static donatedPreferencesChanged() {
		// Check if donated
		const donated = this.getDonatedPref();
		this.evaluateDonateTime = donated ? undefined : this.now();
	}


	/**
	 * Is called from a location that is frequently used.
	 * E.g. the code lenses.
	 * It checks if there is time (and other conditions) to show the
	 * donate nag screen.
	 */
	public static async checkDonateInfo() {
		if (this.enableDonationInfo) {
			// Check if enabled
			if (this.evaluateDonateTime != undefined &&
				this.now() >= this.evaluateDonateTime) {
				// Evaluate only once per day or activation.
				this.evaluateDonateTime = this.now() + this.daysInMs(1);
				// Check if time already set
				if (this.donateEndTime == undefined) {
					this.donateEndTime = this.getDonationTime();
					if (this.donateEndTime == undefined) {
						this.donateEndTime = this.now() + this.daysInMs(14);
						this.setDonationTime(this.donateEndTime);
					}
				}
				if (this.now() < this.donateEndTime) {
					// Time not elapsed yet.
					// Show info as error text (warning and info text goes away by itself after a short timeout)
					const selected = await this.showInfoMessage("If you use 'ASM Code Lens' regularly please support the project. Every little donation helps keeping the project running.", "Yes, please. I want to show my support.", "Not now");
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
	}


	/**
	 * Returns the number of days in ms.
	 */
	protected static daysInMs(days: number): number {
		/* For testing purposes:
		if (days == 1)
			return 1000 * 10 * 60; // 10 mins
		else
			return 1000 * 60 * 60;	// 1 hour
		*/
		return days * 24 * 60 * 60 * 1000;
	}
}
