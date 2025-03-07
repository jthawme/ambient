import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Router } from 'express';
import { Server } from 'socket.io';

import * as Types from '../types/options.js';
import { events } from '../events.js';
import { asyncInterval } from '../utils.js';
import { log } from '../logs.js';
import { DEFAULT_OPTIONS, EVENT } from '../constants.js';
import { apiWrapper, isSpotifyUrl, SpotifyUrl, protect } from './utils.js';
import { SpotifyInteract } from './interact.js';

const cachedInfo = { current: null };

/**
 *
 * @param {Server} io
 * @param {{current: SpotifyApi | null}} sdk
 * @param {Types.ApiOptions} opts
 * @param {boolean} verbose
 */
const run = (io, sdk, opts = {}, verbose = false) => {
	const options = {
		...DEFAULT_OPTIONS.api,
		...opts
	};

	const app = Router();

	app.get(
		'/artist/:id',
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.artist.topTracks(req.sdk, req.params.id);
			return res.json(response);
		})
	);

	app.get(
		'/album/:id',
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.album.get(req.sdk, req.params.id);
			return res.json(response);
		})
	);

	app.get(
		'/search',
		apiWrapper(async (req, res) => {
			// Special case for handling if someone has posted a Spotify URL into the search box
			if (isSpotifyUrl(req.query.q)) {
				const { type, id } = SpotifyUrl(req.query.q);

				switch (type) {
					case 'track': {
						const response = await SpotifyInteract.track.get(req.sdk, id);
						return res.json(response);
					}
					case 'artist': {
						const response = await SpotifyInteract.artist.topTracks(req.sdk, id);
						return res.json(response);
					}
					case 'album': {
						const response = await SpotifyInteract.album.get(req.sdk, id);
						return res.json(response);
					}
				}
			}

			const response = await SpotifyInteract.search.query(
				req.sdk,
				req.query.q,
				options.market,
				options.searchQueryLimit
			);
			return res.json(response);
		})
	);

	app.get(
		'/add',
		protect([options.canAdd]),
		apiWrapper(async (req, res) => {
			const { success } = await SpotifyInteract.queue.add(req.sdk, req.query.uri);

			if (!success) {
				req.comms.error('Song already in queue');
			} else {
				req.comms.message(`Added <em>${req.query.name ?? 'a track'}</em>`, 'track');
			}
			events.system('add');

			return res.json({ success });
		})
	);

	app.get(
		'/info',
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.info.get(req.sdk, options.market);
			return res.json(response);
		})
	);

	app.get(
		'/queue',
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.queue.get(req.sdk);
			return res.json(response);
		})
	);

	app.get(
		'/skipForward',
		protect([options.canControl]),
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.player.forward(req.sdk);

			req.comms.message('Skipped forward');
			events.system('skippedForward');

			return res.json(response);
		})
	);

	app.get(
		'/skipBackward',
		protect([options.canControl]),
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.player.back(req.sdk);

			req.comms.message('Skipped back');
			events.system('skippedBackward');

			return res.json(response);
		})
	);

	app.get(
		'/play',
		protect([options.canControl]),
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.player.play(req.sdk);

			req.comms.message('Pressed play');
			events.system('play');

			return res.json(response);
		})
	);

	app.get(
		'/pause',
		protect([options.canControl]),
		apiWrapper(async (req, res) => {
			const response = await SpotifyInteract.player.pause(req.sdk);

			req.comms.message('Pressed pause');
			events.system('pause');

			return res.json(response);
		})
	);

	app.get('/health', (req, res) => res.json({ success: true, authenticated: !!req.sdk }));
	app.get('/reauthenticate', (req, res) => {
		sdk.current = null;
		res.json({ success: true });
	});

	if (options.centralisedPolling) {
		io.on('connect', (socket) => {
			if (cachedInfo.current) {
				if (verbose) {
					console.log('Sending client current cached track');
				}

				socket.emit('info', cachedInfo.current);
			}
		});

		asyncInterval(async () => {
			try {
				if (verbose) {
					console.log('Running centralised polling');
				}

				if (!sdk.current) {
					return;
				}

				// If there are no clients, don't bother using an API call - or just once if there is no cached info
				if (io.engine.clientsCount > 0 || !cachedInfo.current) {
					const info = await SpotifyInteract.info.get(sdk.current);
					io.emit('info', info);

					// Allows us to pass to new sockets immediately
					cachedInfo.current = info;

					if (verbose) {
						console.log('Ran centralised polling');
					}
				}
			} catch (e) {
				events.error(e.message, e);
				log.error(e);

				if (verbose) {
					console.log('Error on polling');
				}
			}
		}, options.centralisedPollingTimer);
	}

	return app;
};

export default run;
