import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import fs from 'node:fs/promises';

import { events } from '../events.js';
import { log } from '../logs.js';

/**
 *
 * @param {Types.SpotifyOptions['accessTokenJsonLocation']} filePath
 * @param {string} client_id
 * @param {Types.SpotifyAccessToken} accessTokenData
 * @returns
 */
export async function persistSdk(filePath, client_id, accessTokenData) {
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
				log.error(error);
			}
		}
	});
}
