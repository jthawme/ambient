export const mergeOptions = (opts, defaultOptions) => {
	return {
		...defaultOptions,
		...opts
	};
};

/**
 *
 * @param {() => Promise<any>} func
 * @param {number} rate
 * @returns
 */
export const asyncInterval = (func, rate) => {
	let timerId = 0;

	const run = async () => {
		await func();

		timerId = setTimeout(run, rate);
	};

	run();

	return () => {
		clearTimeout(timerId);
	};
};
