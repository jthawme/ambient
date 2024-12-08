import { memo } from '../memo.js';
import { DEFAULT_OPTIONS } from '../constants.js';
import { trim, getContext } from './utils.js';

export const SpotifyInteract = {
	artist: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {string} id
		 */
		async topTracks(sdk, id) {
			/** @type {import('@spotify/web-api-ts-sdk').TopTracksResult} */
			const results = await memo.use(memo.key('artist', 'tracks', id), () =>
				sdk.artists.topTracks(id)
			);

			return {
				tracks: results.tracks.map(trim.track)
			};
		}
	},

	album: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {string} id
		 */
		async get(sdk, id) {
			/** @type {import('@spotify/web-api-ts-sdk').Album} */
			const album = await memo.use(memo.key('album', id), () => sdk.albums.get(id));

			return {
				tracks: album.tracks.items
					.map((item) => ({
						...item,
						album: album
					}))
					.map(trim.track)
			};
		}
	},

	track: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {string} id
		 */
		async get(sdk, id) {
			/** @type {import('@spotify/web-api-ts-sdk').Track} */
			const track = await memo.use(memo.key('track', id), () => sdk.tracks.get(id));

			return {
				tracks: [trim.track(track)]
			};
		}
	},

	queue: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async get(sdk) {
			const queue = await sdk.player.getUsersQueue();

			if (!queue) {
				return {
					noQueue: true
				};
			}

			return {
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
			};
		},

		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {string} uri
		 */
		async add(sdk, uri) {
			const { queue } = await sdk.player.getUsersQueue();

			// Check if the item the user is trying to add is already in the queue
			if (queue.some((item) => item.uri === uri)) {
				return {
					success: false
				};
			}

			await sdk.player.addItemToPlaybackQueue(uri);

			return {
				success: true
			};
		}
	},

	search: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {string} q
		 * @param {import('@spotify/web-api-ts-sdk').Market} q
		 * @param {number} q
		 */
		async query(
			sdk,
			q,
			market = DEFAULT_OPTIONS.api.market,
			searchQueryLimit = DEFAULT_OPTIONS.api.searchQueryLimit
		) {
			const results = await memo.use(memo.key('search', q), () =>
				sdk.search(q, ['track', 'artist', 'album'], market, searchQueryLimit)
			);

			return {
				albums: results.albums.items.map(trim.album),
				artists: results.artists.items.map(trim.artist),
				tracks: results.tracks.items.map(trim.track)
			};
		}
	},

	context: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async get(sdk, uri) {
			/** @type {Types.ApiContext | {}} */
			const context = await memo.use(uri, () => getContext(sdk, uri));

			return context;
		}
	},

	info: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 * @param {import('@spotify/web-api-ts-sdk').Market} [market]
		 */
		async get(sdk, market = DEFAULT_OPTIONS.api.market) {
			const track = await sdk.player.getCurrentlyPlayingTrack(market, 'episode');

			if (!track) {
				return {
					noTrack: true
				};
			}

			const context = await SpotifyInteract.context.get(sdk, track.context.uri);

			return {
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
			};
		}
	},

	player: {
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async play(sdk) {
			await sdk.player.startResumePlayback();

			return { success: true };
		},
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async pause(sdk) {
			await sdk.player.pausePlayback();

			return { success: true };
		},
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async forward(sdk) {
			await sdk.player.skipToNext();

			return { success: true };
		},
		/**
		 *
		 * @param {SpotifyApi} sdk
		 */
		async back(sdk) {
			await sdk.player.skipToPrevious();

			return { success: true };
		}
	}
};
