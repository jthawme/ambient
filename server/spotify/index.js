import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Router } from 'express';

import { ERROR, DEFAULT_OPTIONS } from '../constants.js';
import * as Types from '../types.js';
import { events } from '../events.js';
import { mergeOptions } from '../utils.js';
import { initialisePreviousAuth, SpotifyAuth } from './auth.js';
import { persistSdk } from './sdk.js';

// These scoped items are fixed and necessary for the app to run
const SCOPE = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state'
];

/**
 *
 * @param {{current: null | SpotifyApi}} sdk
 * @param {Partial<Types.SpotifyOptions> & {port: number}} opts
 */
const run = async (sdk, opts = {}) => {
	/** @type {Types.SpotifyOptions & {port: number}} */
	const options = mergeOptions(opts, DEFAULT_OPTIONS);

	// First check if there is previous auth that is valid
	const refreshedAuth = await initialisePreviousAuth(options);

	// If there is, initialise it while also persisting the auth
	if (refreshedAuth) {
		sdk.current = await persistSdk(
			options.accessTokenJsonLocation,
			options.client_id,
			refreshedAuth
		);
	}

	// Initalise a sub router
	const app = Router();

	// Construct the spotify redirect_uri
	const redirect_uri = [
		[options.origin, options.port].join(':'),
		options.routePrefix,
		options.routeToken
	].join('');

	// Merge scopes, ensuring the necessary ones are applied and duplicates are removed
	const scope = [...new Set([...SCOPE, options.scope])].join(' ');

	/**
	 * The start route, kicks off the authorisation process, by redirecting to the spotify authorise page
	 */
	app.get('/start', (req, res) => {
		// If the SDK is already attached to the request object, assume its authenticated and bypass the start
		if (req.sdk) {
			res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
			return;
		}

		const url = new URL('https://accounts.spotify.com/authorize');
		url.search = new URLSearchParams({
			response_type: 'code',
			client_id: options.client_id,
			scope,
			redirect_uri
		});

		res.redirect(url.toString());
	});

	/**
	 * This route is the route that is redirected to after spotify has authed the user
	 */
	app.get(options.routeToken, async (req, res) => {
		// If the SDK is already attached to the request object, assume its authenticated and bypass the start
		if (req.sdk) {
			res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
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

		const accessTokenJson = await SpotifyAuth.token.get(
			options.client_id,
			options.client_secret,
			code,
			redirect_uri
		);
		sdk.current = await persistSdk(
			options.accessTokenJsonLocation,
			options.client_id,
			accessTokenJson
		);

		res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
	});

	return app;
};

export default run;
