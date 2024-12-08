import os from 'node:os';
import deepmerge from 'deepmerge';
import { spawn } from 'node:child_process';

export const name = 'kiosk';
export const skip = process.env.NODE_ENV === 'development';

/**
 *
 * @param {string} type
 * @param {any} message
 */
function log(type, message) {
	console.log(`[${name}:${type}]`, message);
}
/**
 *
 * @param {string} command
 * @param {string[]} args
 * @param {boolean} verbose
 */
function launch(command, args, verbose) {
	const child = spawn(command, args);

	if (verbose) {
		child.stdout.setEncoding('utf8');
		child.stdout.on('data', (data) => {
			log('info', data);
		});

		child.stderr.setEncoding('utf8');
		child.stderr.on('data', (data) => {
			log('error', data);
		});

		child.on('close', (code) => {
			log('close', code);
		});
	}
}

const DEFAULT_OPTIONS = {
	/** @type {'pi' | 'mac' | 'auto' | undefined} */
	platform: 'auto',

	pi: {
		command: `/usr/bin/chromium-browser`,
		args: ['--start-maximized', '--kiosk', '--noerrdialogs', '--disable-infobars', '--no-first-run']
	},

	mac: {
		command: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		args: []
	}
};

/**
 * TODO lot to experiment with here
 *
 * @returns {'pi' | 'mac' | false}
 */
function detectPlatform() {
	if (os.platform() === 'darwin') {
		return 'mac';
	}

	if (os.platform() === 'linux') {
		return 'pi';
	}

	return false;
}

/**
 * @param {import("../server/types/options").PluginItemInject} inject
 */
export const handler = ({ events, config, info }) => {
	const options = deepmerge(DEFAULT_OPTIONS, config.pluginOptions?.kiosk ?? {});

	/** @type {'pi' | 'mac' | false} */
	const platform =
		!options.platform || options.platform === 'auto' ? detectPlatform() : options.platform;

	events.on('system:start', () => {
		if (platform) {
			launch(options[platform].command, [...options[platform].args, info.player], config.verbose);
		} else {
			log('error', 'No supported platform');
		}
	});
};
