import deepmerge from 'deepmerge';
import dotenv from 'dotenv';
import * as Types from './types/options.js';

import { DEFAULT_OPTIONS } from './constants.js';
import { getIp } from './utils.js';

dotenv.config();

const INJECTED_OPTIONS = {
	origin: process.env.ORIGIN ?? getIp(),
	protocol: process.env.PROTOCOL ?? 'http://',
	port: process.env.PORT ?? 3000,
	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	}
};

/** @type {Types.Config} */
const USER_OPTIONS = await import('../ambient.config.js')
	.then((module) => module.default)
	.catch(() => ({}));

/** @type {Types.SpotifyAmbientDisplayOptions & {plugins: Types.Config['plugins']}} */
export const OPTIONS = deepmerge(DEFAULT_OPTIONS, deepmerge(INJECTED_OPTIONS, USER_OPTIONS));
