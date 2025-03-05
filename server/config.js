import deepmerge from 'deepmerge';
import dotenv from 'dotenv';
import * as Types from './types/options.js';

import { DEFAULT_OPTIONS } from './constants.js';
import { expandAliases, getIp } from './utils.js';

dotenv.config();

const INJECTED_OPTIONS = {
	verbose: 'VERBOSE' in process.env && process.env.VERBOSE?.toLowerCase() !== 'false',
	origin: process.env.ORIGIN ?? getIp(),
	protocol: process.env.PROTOCOL ?? 'http://',
	port: process.env.PORT ?? 3000,
	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	}
};

if (process.env.CONFIG) {
	console.log(`Loading config from ${expandAliases(process.env.CONFIG)}`);
}

/** @type {Types.Config} */
const USER_OPTIONS = await import(expandAliases(process.env.CONFIG ?? '../ambient.config.js'))
	.then((module) => module.default)
	.catch(() => ({}));

if (INJECTED_OPTIONS.verbose ?? USER_OPTIONS.verbose) {
	console.log(`config`);
	console.log(USER_OPTIONS);
}

/** @type {Types.SpotifyAmbientDisplayOptions & {plugins: Types.Config['plugins']}} */
export const OPTIONS = deepmerge(DEFAULT_OPTIONS, deepmerge(INJECTED_OPTIONS, USER_OPTIONS));
