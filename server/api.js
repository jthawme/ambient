import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import express from 'express';
import * as Types from './types.js';

const DEFAULT_OPTS = {
	market: 'GB',
	searchQueryLimit: 10
};

const normalisedData = (id, name, subtitle, uri, images) => ({
	id,
	title: name,
	subtitle,
	uri: uri,
	image: {
		full: images.at(0),
		low: images.at(-1)
	}
});

const trim = {
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Track} track
	 */
	track(track) {
		return {
			id: track.id,
			normalised: normalisedData(
				track.id,
				track.name,
				track.artists[0].name,
				track.uri,
				track?.album?.images ?? []
			),
			title: track.name,
			album: track.album.name,
			artist: track.artists[0].name,
			artists: track.artists.map((artist) => artist.name),
			number: track.track_number,
			uri: track.uri,
			image: {
				full: track.album.images.at(0),
				low: track.album.images.at(-1)
			}
		};
	},
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Playlist} playlist
	 */
	playlist(playlist) {
		return {
			id: playlist.id,
			normalised: normalisedData(
				playlist.id,
				playlist.name,
				playlist.owner.display_name,
				playlist.uri,
				playlist.images
			),
			title: playlist.name,
			owner: playlist.owner.display_name,
			total: playlist.tracks.total,
			tracks: playlist.tracks.items,
			uri: playlist.uri,
			image: {
				full: playlist.images.at(0),
				low: playlist.images.at(-1)
			}
		};
	},
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Artist} artist
	 */
	artist(artist) {
		return {
			id: artist.id,
			normalised: normalisedData(artist.id, artist.name, '', artist.uri, artist.images),
			title: artist.name,
			uri: artist.uri,
			image: {
				full: artist.images.at(0),
				low: artist.images.at(-1)
			}
		};
	},
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Album} album
	 */
	album(album) {
		return {
			normalised: normalisedData(
				album.id,
				album.name,
				album.release_date.split('-').shift(),
				album.uri,
				album.images
			),
			id: album.id,
			title: album.name,
			release: album.release_date,
			uri: album.uri,
			total: album.total_tracks,
			image: {
				full: album.images.at(0),
				low: album.images.at(-1)
			}
		};
	},
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Episode} episode
	 */
	episode(episode) {
		return {
			id: episode.id,
			normalised: normalisedData(
				episode.id,
				episode.name,
				episode.show.name,
				episode.uri,
				episode.images
			),
			title: episode.name,
			show: episode.show.name,
			release: episode.release_date,
			uri: episode.uri,
			image: {
				full: episode.images.at(0),
				low: episode.images.at(-1)
			}
		};
	},
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Show} show
	 */
	show(show) {
		return {
			id: show.id,
			normalised: normalisedData(show.id, show.name, '', show.uri, show.images),
			title: show.name,
			uri: show.uri,
			image: {
				full: show.images.at(0),
				low: show.images.at(-1)
			}
		};
	}
};

const deconstructUri = (uri) => {
	const [_, type, id] = uri.split(':');

	return {
		type,
		id
	};
};

/**
 *
 * @param {SpotifyApi} sdk
 * @param {string} uri
 */
const getContext = async (sdk, uri) => {
	const { type, id } = deconstructUri(uri);

	try {
		switch (type) {
			case 'playlist': {
				const playlist = await sdk.playlists.getPlaylist(id);

				return {
					...trim.playlist(playlist),
					type: 'playlist'
				};
			}
			case 'artist': {
				const artist = await sdk.artists.get(id);

				return {
					...trim.artist(artist),
					type: 'artist'
				};
			}
			case 'album': {
				const album = await sdk.albums.get(id);

				return {
					...trim.album(album),
					type: 'album'
				};
			}
			case 'show': {
				const show = await sdk.shows.get(id);

				return {
					...trim.show(show),
					type: 'show'
				};
			}
			default: {
				return {};
			}
		}
	} catch {
		return {};
	}
};

function apiWrapper(handler) {
	return async (req, res, next) => {
		try {
			await handler(req, res);
		} catch (e) {
			console.error('API Error', e);
			req.comms.error('Check Logs');
			next(e);
		}
	};
}

/**
 *
 * @param {Types.ApiOptions} opts
 */
const run = (sdk, opts = {}) => {
	const options = {
		...DEFAULT_OPTS,
		...opts
	};

	const app = express();

	app.get(
		'/artist/:id',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			const results = await sdk.artists.topTracks(req.params.id);

			return res.json({
				tracks: results.tracks.map(trim.track)
			});
		})
	);

	app.get(
		'/album/:id',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;

			const album = await sdk.albums.get(req.params.id);

			return res.json({
				tracks: album.tracks.items
					.map((item) => ({
						...item,
						album: album
					}))
					.map(trim.track)
			});
		})
	);

	app.get(
		'/search',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			const results = await sdk.search(
				req.query.q,
				['track', 'artist', 'album'],
				options.market,
				options.searchQueryLimit
			);

			return res.json({
				albums: results.albums.items.map(trim.album),
				artists: results.artists.items.map(trim.artist),
				tracks: results.tracks.items.map(trim.track)
			});
		})
	);

	app.get(
		'/add',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;

			const { queue } = await sdk.player.getUsersQueue();

			if (queue.some((item) => item.uri === req.query.uri)) {
				req.comms.error('Song already in queue');
				return res.json({
					success: false
				});
			}

			const track = await sdk.tracks.get(deconstructUri(req.query.uri).id);

			const result = await sdk.player.addItemToPlaybackQueue(req.query.uri);

			req.comms.message(`Added <em>${track.name}</em>`, 'track');

			return res.json({
				result,
				track
			});
		})
	);

	app.get(
		'/info',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			const track = await sdk.player.getCurrentlyPlayingTrack(options.market, 'episode');

			if (!track) {
				return res.json({
					noTrack: true
				});
			}

			const context = await getContext(sdk, track.context.uri);

			return res.json({
				isPlaying: track?.is_playing,
				track:
					track.currently_playing_type === 'episode'
						? trim.episode(track.item)
						: trim.track(track.item),
				context,
				player: {
					current: track.progress_ms,
					duration: track.item.duration_ms
				}
				// full: track
			});
		})
	);

	app.get(
		'/queue',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			const queue = await sdk.player.getUsersQueue();

			if (!queue) {
				return res.json({
					noQueue: true
				});
			}

			return res.json({
				items: [queue.currently_playing, ...queue.queue]
					.filter((item) => !!item)
					.map((item) => {
						switch (item.type) {
							case 'episode':
								return trim.episode(item);
							case 'track':
								return trim.track(item);
							default:
								return item;
						}
					}),
				full: queue
			});
		})
	);

	app.get(
		'/skipForward',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			await sdk.player.skipToNext();

			req.comms.message('Skipped forward');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/skipBackward',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			await sdk.player.skipToPrevious();

			req.comms.message('Skipped back');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/play',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			await sdk.player.startResumePlayback();

			req.comms.message('Pressed play');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/pause',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			await sdk.player.pausePlayback();

			req.comms.message('Pressed pause');

			return res.json({
				success: true
			});
		})
	);

	app.get('/health', (req, res) => res.json({ success: true, authenticated: !!req.sdk }));

	return app;
};

export default run;
