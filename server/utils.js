import os from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 *
 * @param {() => Promise<any>} func
 * @param {number} rate
 * @returns
 */
export const asyncInterval = (func, rate) => {
	/** @type {undefined | ReturnType<typeof setTimeout>} */
	let timerId;

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
		.filter((item) => item && item.family === 'IPv4' && !item.internal);
	return item?.address;
};

/**
 *
 * @param {string} url
 */
export const isMain = (url) => {
	return process.argv[1] === fileURLToPath(url);
};
