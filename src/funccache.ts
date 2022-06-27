

/**
 * A class to cache the data returned by a function for a given time.
 * Usage:
 * ~~~ts
 * const cache = new Cache<string>(10000 () => {
 * 		return getLongLastingFunction();
 * });
 *
 * const result = cache.getData();
 * ~~~
 */
export class FuncCache<T>{
	// The data is cached here.
	protected cachedData: T;

	// The function to call.
	protected func: () => T;

	// Stores the next time when func requires to be called.
	protected nextTime: number;

	// Stores the time interval for which cached data is returned.
	protected cacheTime;


	/**
	 * Constructor.
	 * @param cacheTime The time in ms the data should be taken from the cache.
	 * @param func The function to call to get the data.
	 */
	constructor(cacheTime: number, func: () => T) {
		this.cacheTime = cacheTime;
		this.func = func;
		// Make sure the first call refreshes the cache.
		this.nextTime = Date.now();
	}


	/**
	 * Returns the data. Either from cache or fresh data.
	 * If the last fresh data is older then cacheTime ms then func is called
	 * to get fresh data.
	 * @returns The data that func would return.
	 */
	public getData(): T {
		const currTime = Date.now();
		if (currTime >= this.nextTime) {
			// Timeover, get fresh data
			this.cachedData = this.func();
			// Remember next time
			this.nextTime = currTime + this.cacheTime;
		}
		return this.cachedData;
	}

}
