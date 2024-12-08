import fs from 'node:fs/promises';

import * as Types from '../types.js';

export const SpotifyAuth = {
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
export async function initialisePreviousAuth({
	accessTokenJsonLocation,
	client_id,
	client_secret
}) {
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
