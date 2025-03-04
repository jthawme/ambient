import os from 'node:os';
import { fileURLToPath } from 'node:url';

/**
 *
 * @param {string} url
 * @returns
 */
export const __dirname = (url) => {
	return fileURLToPath(new URL('.', url));
};

const timer = (time) => {
	return new Promise((resolve) => setTimeout(resolve, time));
};

/**
 *
 * @param {() => Promise<any>} asyncInteralFunc
 * @param {number} rate
 * @returns
 */
export const asyncInterval = (asyncInteralFunc, rate) => {
	/** @type {undefined | ReturnType<typeof setTimeout>} */
	let timerId;

	const run = async () => {
		await asyncInteralFunc();

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

/**
 *
 * @param {() => void} catchAndRetryFunc
 * @param {{ times?: number, validateError?: () => boolean, backoff?: number}} opts
 */
export const catchAndRetry = async (
	catchAndRetryFunc,
	{ times = 10, validateError = () => true, backoff = 1000 } = {}
) => {
	return new Promise((resolve, reject) => {
		const run = async (retry = 0) => {
			try {
				const resp = await catchAndRetryFunc();
				resolve(resp);
			} catch (e) {
				if (validateError(e) && retry < times) {
					await timer(backoff);
					run(retry + 1);
				} else {
					reject(e);
				}
			}
		};

		run();
	});
};

/**
 *
 * @param {string} filePath
 */
export const expandAliases = (filePath) => {
	if (filePath.startsWith('~')) {
		return os.homedir() + filePath.slice(0);
	}

	if (filePath.startsWith('$HOME')) {
		return os.homedir() + filePath.slice('$HOME'.length);
	}

	return filePath;
};
