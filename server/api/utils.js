import * as Types from '../types/data.js';

/**
 *
 * @param {string} id
 * @param {string} name
 * @param {string} subtitle
 * @param {string} uri
 * @param {{url: string, width: number, height: number}[]} images
 * @returns {Types.ApiNormalisedItem}
 */
export const normalisedData = (id, name, subtitle, uri, images) => ({
	id,
	title: name,
	subtitle,
	uri: uri,
	image: {
		full: images.at(0),
		low: images.at(-1)
	}
});

export const trim = {
	/**
	 *
	 * @param {import('@spotify/web-api-ts-sdk').Track} track
	 * @returns {Types.ApiTrackItem & Types.ApiNormalisedItem}
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
	 * @returns {Types.ApiPlaylistItem & Types.ApiNormalisedItem}
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
	 * @returns {Types.ApiArtistItem & Types.ApiNormalisedItem}
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
	 * @returns {Types.ApiAlbumItem & Types.ApiNormalisedItem}
	 */
	album(album) {
		return {
			normalised: normalisedData(
				album.id,
				album.name,
				album.release_date.split('-').shift() ?? '',
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
	 * @returns {Types.ApiEpisodeItem & Types.ApiNormalisedItem}
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
	 * @returns {Types.ApiShowItem & Types.ApiNormalisedItem}
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
export const deconstructUri = (uri) => {
	const [_, type, id] = uri.split(':');

	return {
		type,
		id
	};
};

/**
 *
 * @param {import('@spotify/web-api-ts-sdk').SpotifyApi} sdk
 * @param {string} uri
 * @return {Promise<Types.ApiContext | {}>}
 */
export const getContext = async (sdk, uri) => {
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

/**
 *
 * @param {(req: import('express').Request & {sdk: import('@spotify/web-api-ts-sdk').SpotifyApi}, res: import('express').Response, next?: import('express').NextFunction)} handler
 * @returns
 */
export function apiWrapper(handler) {
	return async (
		/** @type {import('express').Request & {sdk: import('@spotify/web-api-ts-sdk').SpotifyApi}} */ req,
		/** @type {import('express').Response} */ res,
		/** @type {import('express').NextFunction} */ next
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

export function isSpotifyUrl(url) {
	return SpotifyRegExp.test(url);
}

export function SpotifyUrl(url) {
	const [_, typeOne, typeTwo, id] = SpotifyRegExp.exec(url);

	return {
		type: typeOne || typeTwo,
		id
	};
}

/**
 *
 * @param {boolean[]} switches
 * @returns {(req: import("express").Request, req: import("express").Response, req: import("express").NextFunction)}
 */
export const protect = (switches) => {
	return (req, res, next) => {
		if (!switches.every((item) => !!item)) {
			req.comms.error('Not allowed');

			return res.json({ success: false });
		}

		next();
	};
};
