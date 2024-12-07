import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Router } from 'express';

import * as Types from './types.js';
import { memo } from './memo.js';
import { events } from './events.js';

/** @type {Types.ApiOptions} */
const DEFAULT_OPTS = {
	market: 'GB',
	searchQueryLimit: 10
};

/**
 *
 * @param {string} id
 * @param {string} name
 * @param {string} subtitle
 * @param {string} uri
 * @param {{url: string, width: number, height: number}[]} images
 * @returns {Types.ApiNormalisedItem}
 */
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
	 * @returns {Types.ApiTrackItem}
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
	 * @returns {Types.ApiPlaylistItem}
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
	 * @returns {Types.ApiArtistItem}
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
	 * @returns {Types.ApiAlbumItem}
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
	 * @returns {Types.ApiEpisodeItem}
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
	 * @returns {Types.ApiShowItem}
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

/**
 *
 * @param {string} uri Spotify URI
 */
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
	} catch (e) {
		return {};
	}
};

/**
 *
 * @param {(req: import('express').Request & {sdk: SpotifyApi}, res: import('express').Response, next: import('express').NextFunction)} handler
 * @returns
 */
function apiWrapper(handler) {
	return async (
		/** @type {import('express').Request & {sdk: SpotifyApi}} */ req,
		/** @type {import('express').Response} */ res,
		next
	) => {
		try {
			await handler(req, res);
		} catch (e) {
			console.error('API Error', e);
			// req.comms.error('Check Logs');
			next(e);
		}
	};
}

const SpotifyRegExp = new RegExp(
	/https?:\/\/(?:embed\.|open\.)(?:spotify\.com\/)(?:(track|album|artist)\/|\?uri=spotify:(track|album|artist):)((\w|-){22})/
);

function isSpotifyUrl(url) {
	return SpotifyRegExp.test(url);
}

function SpotifyUrl(url) {
	const [_, typeOne, typeTwo, id] = SpotifyRegExp.exec(url);

	return {
		type: typeOne || typeTwo,
		id
	};
}

/**
 *
 * @param {Types.ApiOptions} opts
 */
const run = (opts = {}) => {
	const options = {
		...DEFAULT_OPTS,
		...opts
	};

	const app = Router();

	app.get(
		'/artist/:id',
		apiWrapper(async (req, res) => {
			const results = await memo.use(req.params.id, () => req.sdk.artists.topTracks(req.params.id));

			return res.json({
				tracks: results.tracks.map(trim.track)
			});
		})
	);

	app.get(
		'/album/:id',
		apiWrapper(async (req, res) => {
			const album = await memo.use(req.params.id, () => req.sdk.albums.get(req.params.id));

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
			if (isSpotifyUrl(req.query.q)) {
				const { type, id } = SpotifyUrl(req.query.q);
				const key = memo.key(type, id);

				switch (type) {
					case 'track': {
						const track = await memo.use(key, () => req.sdk.tracks.get(id));

						return res.json({
							tracks: [trim.track(track)]
						});
					}
					case 'artist': {
						const topTracks = await memo.use(key, () => req.sdk.artists.topTracks(id));

						return res.json({
							tracks: topTracks.tracks.map(trim.track)
						});
					}
					case 'album': {
						const tracks = await memo.use(
							key,
							() => req.sdk.albums.get(id),
							({ tracks }) => tracks
						);

						return res.json({
							tracks: tracks.items.map(trim.track)
						});
					}
				}
			}

			const results = await memo.use(memo.key('search', req.query.q), () =>
				req.sdk.search(
					req.query.q,
					['track', 'artist', 'album'],
					options.market,
					options.searchQueryLimit
				)
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
			const { queue } = await req.sdk.player.getUsersQueue();

			// Check if the item the user is trying to add is already in the queue
			if (queue.some((item) => item.uri === req.query.uri)) {
				req.comms.error('Song already in queue');
				return res.json({
					success: false
				});
			}

			const track = await memo.use(req.query.uri, () =>
				req.sdk.tracks.get(deconstructUri(req.query.uri).id)
			);

			const result = await req.sdk.player.addItemToPlaybackQueue(req.query.uri);

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
			const track = await req.sdk.player.getCurrentlyPlayingTrack(options.market, 'episode');

			if (!track) {
				return res.json({
					noTrack: true
				});
			}

			const context = await memo.use(track.context.uri, () =>
				getContext(req.sdk, track.context.uri)
			);

			return res.json({
				isPlaying: track.is_playing,
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
			const queue = await req.sdk.player.getUsersQueue();

			if (!queue) {
				return res.json({
					noQueue: true
				});
			}

			return res.json({
				items: [queue.currently_playing, ...queue.queue]
					.filter((item) => !!item)
					.filter((item) => !['episode', 'track'].includes(item.type))
					.map((item) => {
						switch (item.type) {
							case 'episode':
								return trim.episode(item);
							default:
								return trim.track(item);
						}
					})
			});
		})
	);

	app.get(
		'/skipForward',
		apiWrapper(async (req, res) => {
			await req.sdk.player.skipToNext();

			req.comms.message('Skipped forward');
			events.system('skippedForward');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/skipBackward',
		apiWrapper(async (req, res) => {
			await req.sdk.player.skipToPrevious();

			req.comms.message('Skipped back');
			events.system('skippedBackward');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/play',
		apiWrapper(async (req, res) => {
			await req.sdk.player.startResumePlayback();

			req.comms.message('Pressed play');
			events.system('play');

			return res.json({
				success: true
			});
		})
	);

	app.get(
		'/pause',
		apiWrapper(async (req, res) => {
			await req.sdk.player.pausePlayback();

			req.comms.message('Pressed pause');
			events.system('pause');

			return res.json({
				success: true
			});
		})
	);

	app.get('/health', (req, res) => res.json({ success: true, authenticated: !!req.sdk }));

	return app;
};

export default run;
