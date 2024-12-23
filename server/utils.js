import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const timer = (time) => {
	return new Promise(resolve => setTimeout(resolve, time));
}

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

	console.log("CHECK", process.argv[1], url, fileURLToPath(url));

	return runner === fileURLToPath(url);
};

/**
 * 
 * @param {() => void} func 
 * @param {{ times?: number, validateError?: () => boolean}} opts 
 */
export const catchAndRetry = async (func, {times = 10, validateError = () => true, backoff = 1000} = {}) => {
	return new Promise((resolve, reject) => {
		const run = async (retry = 0) => {
			try {
				const resp = await func();
				resolve(resp);
			} catch (e) {
				if (validateError(e) && retry < times) {
					await timer(backoff);
					run(retry + 1);
				} else {
					reject(e);
				}
			}
		}

		run();
	});
}