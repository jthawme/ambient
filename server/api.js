import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import express from 'express';

const DEFAULT_OPTS = {};

/**
 * @typedef {object} ApiOptions
 */

const normalisedData = (name, subtitle, uri, images) => ({
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
			normalised: normalisedData(track.name, track.artists[0].name, track.uri, track.album.images),
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
			normalised: normalisedData(
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
			normalised: normalisedData(artist.name, '', artist.uri, artist.images),
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
			normalised: normalisedData(album.name, album.release_date, album.uri, album.images),
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
			normalised: normalisedData(episode.name, episode.show.name, episode.uri, episode.images),
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
			normalised: normalisedData(show.name, '', show.uri, show.images),
			title: show.name,
			uri: show.uri,
			image: {
				full: show.images.at(0),
				low: show.images.at(-1)
			}
		};
	}
};

/**
 *
 * @param {SpotifyApi} sdk
 * @param {string} uri
 */
const getContext = async (sdk, uri) => {
	const [_, type, id] = uri.split(':');

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
			console.error(e);
			next(e);
		}
	};
}

/**
 *
 * @param {ApiOptions} opts
 */
const run = (sdk, opts = {}) => {
	const options = {
		...DEFAULT_OPTS,
		...opts
	};

	const app = express();

	app.get(
		'/search',
		apiWrapper(async (req, res) => {
			const results = await req.sdk.search(req.query.q, ['track']);

			return res.json({
				results: {
					tracks: results.tracks.items.map(trim.track)
				}
			});
		})
	);

	app.get(
		'/info',
		apiWrapper(async (req, res) => {
			/** @type {SpotifyApi} */
			const sdk = req.sdk;
			const track = await sdk.player.getCurrentlyPlayingTrack();

			if (!track) {
				return res.json({
					noTrack: true
				});
			}

			const context = await getContext(sdk, track.context.uri);

			return res.json({
				isPlaying: track?.is_playing,
				track: trim.track(track.item),
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

	app.get('/health', (req, res) => res.json({ success: true, authenticated: !!req.sdk }));

	return app;
};

export default run;
