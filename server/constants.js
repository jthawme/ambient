import * as Types from './types.js';

export const ERROR = {
	GENERAL: 'api/general',
	UNAUTHENTICATED: 'api/unauthenticated',
	SPOTIFY_UNAUTHENTICATED: 'api/spotify_unauthenticated'
};

export const EVENT = {
	APP_ERROR: 'app:error',
	SYSTEM: 'system'
};

/** @type {Types.SpotifyAmbientDisplayOptions} */
export const DEFAULT_OPTIONS = {
	port: 3000,

	verbose: false,

	api: {
		market: 'GB',
		searchQueryLimit: 10,
		centralisedPolling: true,
		centralisedPollingTimer: 5000,
		canAdd: true,
		canControl: true
	},

	spotify: {
		client_id: '',
		client_secret: '',
		origin: 'http://localhost',
		routePrefix: '/spotify',
		routeToken: '/token',
		authenticatedRedirect: '/player',
		accessTokenJsonLocation: './server/spotify_auth.json',
		scope: []
	}
};
