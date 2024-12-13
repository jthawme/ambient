import dotenv from 'dotenv';
dotenv.config();

import * as KioskPlugin from './plugins/KioskMode.js';
import * as SonosPlugin from './plugins/SonosFallback.js';

/** @type {import('./server/types/options.js').Config} */
export default {
	verbose: true,

	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	},

	plugins: [KioskPlugin, SonosPlugin],

	suppressErrors: ['spotify/restricted']
};
