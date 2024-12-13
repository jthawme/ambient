import deepmerge from 'deepmerge';
import { AsyncDeviceDiscovery } from 'sonos';

export const name = 'sonos';
// export const skip = process.env.NODE_ENV === 'development';

/**
 *
 * @param {string} type
 * @param {any} message
 */
function log(type, message) {
	console.log(`[${name}:${type}]`, message);
}

const DEFAULT_OPTIONS = {
	/** @type {'auto' | string | undefined} */
	name: 'auto'
};

/**
 * @param {import("../server/types/options").PluginItemInject} inject
 */
export const handler = async ({ events, config, spotify, sdk, history }) => {
	const options = deepmerge(DEFAULT_OPTIONS, config.pluginOptions?.sonos ?? {});

	const discovery = new AsyncDeviceDiscovery();
	const devices = await discovery.discoverMultiple();
	const devicesInfo = await Promise.all(
		devices.map(async (device) => {
			return device.deviceDescription();
		})
	);
	const deviceObject = devicesInfo.reduce((dict, curr, idx) => {
		return {
			...dict,
			[curr.roomName]: devices[idx]
		};
	}, {});

	/**
	 *
	 * @param {import('$server/history').CommandHistoryItem} command
	 * @returns
	 */
	const controlSonos = async (command) => {
		const state = await spotify.device.get(sdk.current);

		const device = deviceObject[state.device.name];

		if (device) {
			switch (command.type) {
				case '/skipBackward':
					return device.previous();
				case '/skipForward':
					return device.next();
				case '/play':
					return device.play();
				case '/pause':
					return device.pause();
				case '/add':
					// to do

					console.log(command);
					// return device.next();
					return;
			}
		}

		// if (device) {
		// 	await device.next();
		// }
	};

	events.on('app:error', (evt) => {
		if (evt?.message === 'spotify/restricted') {
			if (history.last) {
				controlSonos(history.last);
			}
		}
	});
};
