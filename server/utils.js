import os from 'node:os';

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

export const getIp = () => {
	const [item] = Object.values(os.networkInterfaces())
		.flat()
		.filter((item) => item.family === 'IPv4' && !item.internal);
	return item.address;
};
