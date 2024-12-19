import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
	const runner = !process.argv[1].endsWith('.js')
		? [process.argv[1], 'index.js'].join('/')
		: process.argv[1];

	return runner === fileURLToPath(url);
};
