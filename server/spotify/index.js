import { Router } from 'express';

import { ERROR } from '../constants.js';
import { events } from '../events.js';
import { initialisePreviousAuth, SpotifyAuth } from './auth.js';
import { persistSdk } from './sdk.js';
import { catchAndRetry } from '../utils.js';

// These scoped items are fixed and necessary for the app to run
const SCOPE = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state'
];

/**
 *
 * @param {{current: null | import("@spotify/web-api-ts-sdk").SpotifyApi}} sdk
 * @param {import("../types/options.js").SpotifyAmbientDisplayOptions} options
 */
const run = async (sdk, options) => {
	// First check if there is previous auth that is valid
	const refreshedAuth = await initialisePreviousAuth(options.spotify);

	// If there is, initialise it while also persisting the auth
	if (refreshedAuth) {
		sdk.current = await persistSdk(refreshedAuth, options);
	}

	// Initalise a sub router
	const app = Router();

	// Construct the spotify redirect_uri
	const redirect_uri = [
		[options.protocol, [options.origin, options.port].join(':')].join(''),
		options.spotify.routePrefix,
		options.spotify.routeToken
	].join('');

	// Merge scopes, ensuring the necessary ones are applied and duplicates are removed
	const scope = [...new Set([...SCOPE, options.spotify.scope])].join(' ');

	/**
	 * The start route, kicks off the authorisation process, by redirecting to the spotify authorise page
	 */
	app.get('/start', (req, res) => {
		// If the SDK is already attached to the request object, assume its authenticated and bypass the start
		if (req.sdk) {
			res.redirect(`${options.spotify.authenticatedRedirect}?authenticated=true`);
			return;
		}

		const url = new URL('https://accounts.spotify.com/authorize');
		url.search = new URLSearchParams({
			response_type: 'code',
			client_id: options.spotify.client_id,
			scope,
			redirect_uri
		});

		res.redirect(url.toString());
	});

	/**
	 * This route is the route that is redirected to after spotify has authed the user
	 */
	app.get(options.spotify.routeToken, async (req, res) => {
		// If the SDK is already attached to the request object, assume its authenticated and bypass the start
		if (req.sdk) {
			res.redirect(`${options.spotify.authenticatedRedirect}?authenticated=true`);
			return;
		}

		var code = req.query.code || null;
		var error = req.query.error || null;

		if (error) {
			events.error(ERROR.SPOTIFY_UNAUTHENTICATED);

			return res.json({
				error: true,
				message: ERROR.SPOTIFY_UNAUTHENTICATED
			});
		}

		const accessTokenJson = await catchAndRetry(() => {
			return SpotifyAuth.token.get(
				options.spotify.client_id,
				options.spotify.client_secret,
				code,
				redirect_uri
			);
		});

		sdk.current = await persistSdk(accessTokenJson, options);

		events.system('authenticated');

		res.redirect(`${options.spotify.authenticatedRedirect}?authenticated=true`);
	});

	return app;
};

export default run;
