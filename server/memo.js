export const memoCache = {
	items: {},

	/**
	 *
	 * @param {string} key
	 * @param {number} cacheTime
	 * @returns {boolean}
	 */
	exists(key, cacheTime = 1000 * 60 * 60) {
		return key in this.items && Date.now() - this.items[key].cacheTime < cacheTime;
	},

	/**
	 *
	 * @param {string} key
	 * @returns {any}
	 */
	get(key) {
		return this.items[key].data;
	},

	/**
	 *
	 * @param {string} key
	 * @param {any} data
	 */
	save(key, data) {
		this.items[key] = {
			cacheTime: Date.now(),
			data
		};

		return () => this.delete(key);
	},

	delete(key) {
		delete this.items[key];
	}
};

export const memoKey = (...keys) => keys.join(':');
