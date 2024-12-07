import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Router } from 'express';
import fetch from 'node-fetch';
import fs from 'node:fs/promises';

import { ERROR } from './constants.js';
import * as Types from './types.js';
import { events } from './events.js';
import { mergeOptions } from './utils.js';

// These scoped items are fixed and necessary for the app to run
const SCOPE = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state'
];

const DEFAULT_OPTS = {
	origin: 'http://localhost',
	routePrefix: '/spotify',
	routeToken: '/token',
	authenticatedRedirect: '/player',
	accessTokenJsonLocation: './server/spotify_auth.json',
	scope: []
};

const SpotifyAuth = {
	token: {
		/**
		 * Exchanges a refresh token for a new access token.
		 *
		 * Potentially doesnt return another refresh token, which documentation says to reuse the old one
		 *
		 * @param {string} refresh_token
		 * @returns {Promise<Types.SpotifyAccessToken | {error: string}>}
		 */
		refresh(client_id, client_secret, refresh_token) {
			return fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					grant_type: 'refresh_token',
					refresh_token,
					client_id,
					client_secret
				})
			}).then((resp) => resp.json());
		},

		/**
		 * Exchanges a code for an access token
		 *
		 * @param {string} code
		 * @param {string} redirect_uri
		 * @returns {Promise<Types.SpotifyAccessToken>}
		 */
		get(client_id, client_secret, code, redirect_uri) {
			return fetch('https://accounts.spotify.com/api/token', {
				body: new URLSearchParams({
					code,
					redirect_uri,
					grant_type: 'authorization_code'
				}),
				method: 'POST',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					Authorization:
						'Basic ' + new Buffer.from(client_id + ':' + client_secret).toString('base64')
				}
			}).then((resp) => resp.json());
		}
	}
};

/**
 *
 * @param {import('./types.js').SpotifyOptions} options
 * @returns {Promise<Types.SpotifyAccessToken | false>}
 */
async function initialisePreviousAuth({ accessTokenJsonLocation, client_id, client_secret }) {
	try {
		// Attemps to read the json file of auth, will throw an error if it doesn't exist
		const previousAuth = await fs.readFile(accessTokenJsonLocation, 'utf-8');

		// Parse the object to utilise it
		const previous = JSON.parse(previousAuth);

		const { error, ...token } = await SpotifyAuth.token.refresh(
			client_id,
			client_secret,
			previous.refresh_token,
			previous.access_token
		);

		if (error) {
			// This is a shot in the dark, but this was throwing sometimes in quick success of accessing, so wondered if its a rate limit thing
			if (error === 'invalid_request') {
				return previous;
			}

			throw new Error('Invalid token');
		}

		// Intialise the return with the refresh token, in case it didn't come in the refreshed call. Will get overwritten if it did
		return {
			refresh_token: previous.refresh_token,
			...token
		};
	} catch {
		return false;
	}
}

/**
 *
 * @param {Types.SpotifyOptions['accessTokenJsonLocation']} filePath
 * @param {string} client_id
 * @param {Types.SpotifyAccessToken} accessTokenData
 * @returns
 */
async function persistSdk(filePath, client_id, accessTokenData) {
	// Persist the access token data to disk
	await fs.writeFile(filePath, JSON.stringify(accessTokenData), 'utf-8');

	return SpotifyApi.withAccessToken(client_id, accessTokenData, {
		deserializer: {
			async deserialize(response) {
				const text = await response.text();

				const contentType = response.headers.get('content-type') ?? '';

				if (text.length > 0 && contentType.includes('application/json')) {
					const json = JSON.parse(text);
					return json;
				}

				return null;
			}
		},
		responseValidator: {
			async validateResponse(response) {
				switch (response.status) {
					case 401:
						events.error(`Bad token - Re-auth`);

						throw new Error(
							'Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.'
						);
					case 403: {
						events.error(`Bad token - wrong credentials`);

						const body = await response.text();
						throw new Error(
							`Bad OAuth request (wrong consumer key, bad nonce, expired timestamp...). Unfortunately, re-authenticating the user won't help here. Body: ${body}`
						);
					}
					case 429:
						events.error(
							`Rate Limit - ${Math.round((parseInt(response.headers.get('Retry-After')) / 60) * 10) / 10}s`
						);

						throw new Error('The app has exceeded its rate limits.');
					default:
						if (!response.status.toString().startsWith('20')) {
							events.error(`Spotify Api Error`);

							const body = await response.text();
							throw new Error(
								`Unrecognised response code: ${response.status} - ${response.statusText}. Body: ${body}`
							);
						}
				}
			}
		},
		errorHandler: {
			handleErrors(error) {
				//
			}
		}
	});
}

/**
 *
 * @param {{current: null | SpotifyApi}} sdk
 * @param {Partial<Types.SpotifyOptions> & {port: number}} opts
 */
const run = async (sdk, opts = {}) => {
	/** @type {Types.SpotifyOptions & {port: number}} */
	const options = mergeOptions(opts, DEFAULT_OPTS);

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
