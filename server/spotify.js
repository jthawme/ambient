import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import express from 'express';
import fetch from 'node-fetch';
import fs from 'node:fs/promises';

import { ERROR } from './constants.js';
import * as Types from './types.js';

const SCOPE = [
	'user-read-currently-playing',
	'user-read-playback-state',
	'user-modify-playback-state'
];

const DEFAULT_OPTS = {
	port: 3000,
	origin: 'http://localhost',
	routePrefix: '/spotify',
	authenticatedRedirect: '/player',
	tokenJson: './server/spotify_auth.json',
	scope: ['user-read-currently-playing', 'user-read-playback-state', 'user-modify-playback-state']
};

const SpotifyAuth = {
	token: {
		refresh(refresh_token) {
			return fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					grant_type: 'refresh_token',
					refresh_token,
					client_id: process.env.SPOTIFY_CLIENT_ID,
					client_secret: process.env.SPOTIFY_CLIENT_SECRET
				})
			}).then((resp) => resp.json());
		},

		get(code, redirect_uri) {
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
						'Basic ' +
						new Buffer.from(
							process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
						).toString('base64')
				}
			}).then((resp) => resp.json());
		}
	}
};

async function previousAuth(filePath) {
	try {
		const previousAuth = await fs.readFile(filePath, 'utf-8');
		const previous = JSON.parse(previousAuth);

		const data = await SpotifyAuth.token.refresh(previous.refresh_token, previous.access_token);

		if (data.error) {
			if (data.error === 'invalid_request') {
				return previous;
			}

			return false;
		}

		return {
			refresh_token: previous.refresh_token,
			...data
		};
	} catch (e) {
		console.error(e);
		return false;
	}
}

class FixedResponseDeserializer {
	static async deserialize(response) {
		const text = await response.text();

		const contentType = response.headers.get('content-type') ?? '';

		if (text.length > 0 && contentType.includes('application/json')) {
			const json = JSON.parse(text);
			return json;
		}

		return null;
	}
}

async function persistSdk(filePath, accessTokenData) {
	await fs.writeFile(filePath, JSON.stringify(accessTokenData), 'utf-8');
	return SpotifyApi.withAccessToken(process.env.SPOTIFY_CLIENT_ID, accessTokenData, {
		deserializer: FixedResponseDeserializer
	});
}

/**
 *
 * @param {{current: null | SpotifyApi}} sdk
 * @param {Partial<Types.SpotifyOptions>} opts
 */
const run = async (sdk, opts = {}) => {
	const options = {
		...DEFAULT_OPTS,
		...opts
	};

	const refreshedAuth = await previousAuth(options.tokenJson);

	if (refreshedAuth) {
		sdk.current = await persistSdk(options.tokenJson, refreshedAuth);
	}

	const app = express();
	const redirect_uri = [
		[options.origin, options.port].join(':'),
		options.routePrefix,
		'/token'
	].join('');

	const scope = [...SCOPE, options.scope].join(' ');

	app.get('/start', function (req, res) {
		if (req.sdk) {
			res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
			return;
		}

		const url = new URL('https://accounts.spotify.com/authorize');
		url.search = new URLSearchParams({
			response_type: 'code',
			client_id: process.env.SPOTIFY_CLIENT_ID,
			scope,
			redirect_uri
		});

		res.redirect(url.toString());
	});

	app.get('/token', async (req, res) => {
		if (req.sdk) {
			res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
			return;
		}

		var code = req.query.code || null;
		var error = req.query.error || null;

		if (error) {
			return res.json({
				error: true,
				message: ERROR.SPOTIFY_UNAUTHENTICATED
			});
		}

		const data = await SpotifyAuth.token.get(code, redirect_uri);
		sdk.current = await persistSdk(options.tokenJson, data);

		res.redirect(`${options.authenticatedRedirect}?authenticated=true`);
	});

	return app;
};

export default run;
