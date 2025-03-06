import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import fs from 'node:fs/promises';

import { events } from '../events.js';
import { log } from '../logs.js';
import * as Types from '../types/index.js';
import * as OptionTypes from '../types/options.js';
import { SpotifyAuth } from './auth.js';
import { ERROR } from '../constants.js';
import path from 'node:path';
import { expandAliases, __dirname } from '../utils.js';

class FixedAccessTokenStrategy {
	/**
	 *
	 * @param {Types.SpotifyAccessToken} item
	 * @returns {number}
	 */
	static calculateExpiry(item) {
		return Date.now() + item.expires_in * 1000;
	}

	/**
	 * @param {string} clientId
	 * @param {Types.SpotifyAccessToken} accessToken
	 * @param {(clientId: string, token: Types.SpotifyAccessToken) => Promise<Types.SpotifyAccessToken>} refreshTokenAction
	 */
	constructor(clientId, accessToken, refreshTokenAction) {
		this.clientId = clientId;
		this.accessToken = accessToken;

		this.refreshTokenAction = refreshTokenAction;

		// If the raw token from the jwt response is provided here
		// Calculate an absolute `expiry` value.
		// Caveat: If this token isn't fresh, this value will be off.
		// It's the responsibility of the calling code to either set a valid
		// expires property, or ensure expires_in accounts for any lag between
		// issuing and passing here.

		if (!this.accessToken.expires) {
			this.accessToken.expires = FixedAccessTokenStrategy.calculateExpiry(this.accessToken);
		}
	}

	setConfiguration() {}

	/**
	 *
	 * @returns {Types.SpotifyAccessToken}
	 */
	async getOrCreateAccessToken() {
		if (this.accessToken.expires && this.accessToken.expires <= Date.now()) {
			const refreshed = await this.refreshTokenAction(this.clientId, this.accessToken);
			this.accessToken = refreshed;
		}

		return this.accessToken;
	}

	/**
	 *
	 * @returns {Types.SpotifyAccessToken | null}
	 */
	async getAccessToken() {
		return this.accessToken;
	}

	removeAccessToken() {
		this.accessToken = {
			access_token: '',
			token_type: '',
			expires_in: 0,
			refresh_token: '',
			expires: 0
		};
	}
}

/**
 *
 * @param {Response} resp
 */
const safeBody = async (resp) => {
	const text = await resp.text();

	try {
		return JSON.parse(text);
	} catch {
		return text;
	}
};

/**
 *
 * @param {Types.SpotifyAccessToken} accessTokenData
 * @param {OptionTypes.SpotifyAmbientDisplayOptions} opts
 * @returns
 */
export async function persistSdk(
	accessTokenData,
	{ spotify: { client_id, client_secret, accessTokenJsonLocation }, verbose }
) {
	const p = path.resolve(expandAliases(accessTokenJsonLocation));

	try {
		await fs.access(path.dirname(p));
	} catch (e) {
		if (e.code === 'ENOENT') {
			if (verbose) {
				console.log('Creating the folder to store the credentials');
			}

			await fs.mkdir(path.dirname(p), { recursive: true });

			if (verbose) {
				console.log('Saving a config file in the folder too');
			}
			await fs.copyFile(
				path.join(__dirname(import.meta.url), '../../ambient.config.js.template'),
				path.join(path.dirname(p), './ambient.config.mjs')
			);
		} else {
			console.log('Error accessing credentials folder', e);
		}
	}

	if (verbose) {
		console.log('Persisting credentials in', p);
	}

	// Persist the access token data to disk
	await fs.writeFile(p, JSON.stringify(accessTokenData), 'utf-8');

	return new SpotifyApi(
		new FixedAccessTokenStrategy(client_id, accessTokenData, (_client_id, _client_secret, token) =>
			SpotifyAuth.token.refresh(client_id, client_secret, token.refresh_token, token.access_token)
		),
		{
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
							events.error(ERROR.SPOTIFY_REAUTHENTICATE);

							throw new Error(
								'Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.'
							);
						case 403: {
							const body = await safeBody(response);

							if (typeof body === 'string') {
								events.error(ERROR.SPOTIFY_UNAUTHENTICATED, {
									message: body
								});
							} else {
								if (body.error.message === 'Restricted device') {
									events.error(ERROR.SPOTIFY_RESTRICTED);
								} else {
									events.error(ERROR.SPOTIFY_UNAUTHENTICATED, body);
								}
							}

							throw new Error(
								`Bad OAuth request (wrong consumer key, bad nonce, expired timestamp...). Unfortunately, re-authenticating the user won't help here. Body: ${typeof body === 'string' ? body : JSON.stringify(body)}`
							);
						}
						case 429:
							events.error(ERROR.SPOTIFY_RATE_LIMIT, {
								retry: parseInt(response.headers.get('Retry-After')),
								retryString: `${Math.round((parseInt(response.headers.get('Retry-After')) / 60) * 10) / 10}s`
							});

							throw new Error('The app has exceeded its rate limits.');
						default:
							if (!response.status.toString().startsWith('20')) {
								events.error(ERROR.SPOTIFY_ERROR);

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
					log.error(error);
				}
			}
		}
	);
}
