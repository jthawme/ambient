export const memo = {
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
	},

	/**
	 * A utility that first checks the cache and if not runs the function and saved the return
	 *
	 * @param {string} key
	 * @param {() => Promise<any>} func
	 * @param {(data: any) => any} transform
	 * @returns
	 */
	async use(key, func, transform = (value) => value) {
		if (this.exists(key)) {
			return this.get(key);
		} else {
			this.delete(key);
			const resp = transform(await Promise.resolve().then(() => func()));
			this.save(key, resp);
			return resp;
		}
	},

	key(...args) {
		return args.join(':');
	}
};
