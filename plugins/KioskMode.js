import { spawn } from 'node:child_process';

// `http://${ip.address()}:${PORT}/player`

/**
 *
 * @param {url} url
 */
function ExecuteChromium(url) {
	spawn(`/usr/bin/chromium-browser`, [
		'--start-maximized',
		'--kiosk',
		'--noerrdialogs',
		'--disable-infobars',
		'--no-first-run'
	]);
}

export const handler = () => {};
