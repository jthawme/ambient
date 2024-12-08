/**
 * @typedef {object} SpotifyImageItem
 * @property {string} url
 * @property {number} width
 * @property {number} height
 */
/**
 * @typedef {object} ApiImageDict
 * @property {SpotifyImageItem} full
 * @property {SpotifyImageItem} low
 */

/**
 * @typedef {object} ApiNormalisedItem
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} uri
 * @property {ApiImageDict} image
 */

/**
 * @typedef {object} ApiTrackItem
 * @property {string} title
 * @property {string} album
 * @property {string} artist
 * @property {string[]} artists
 * @property {number} number
 */

/**
 * @typedef {object} ApiPlaylistItem
 * @property {string} title
 * @property {string} owner
 * @property {number} total
 */

/**
 * @typedef {object} ApiArtistItem
 * @property {string} title
 */

/**
 * @typedef {object} ApiAlbumItem
 * @property {string} title
 * @property {string} release
 * @property {number} total
 */

/**
 * @typedef {object} ApiEpisodeItem
 * @property {string} title
 * @property {string} show
 * @property {string} release
 */

/**
 * @typedef {object} ApiShowItem
 * @property {string} title
 */

/**
 * @typedef {object} ApiStandardItem
 * @property {string} id
 * @property {string} uri
 * @property {ApiImageDict} image
 * @property {ApiNormalisedItem} normalised
 */

/**
 * @typedef {(ApiTrackItem | ApiEpisodeItem) & ApiStandardItem} ApiTrack
 */

/**
 * @typedef {{ type: "playlist"} & ApiPlaylistItem & ApiStandardItem | { type: "album"} & ApiAlbumItem & ApiStandardItem | { type: "artist"} & ApiArtistItem & ApiStandardItem | { type: "show"} & ApiShowItem & ApiStandardItem} ApiContext
 */

/**
 * @typedef {object} ApiInfoResponse
 * @property {boolean} isPlaying
 * @property {ApiTrack} track
 * @property {ApiContext} context
 * @property {{ current: number, duration: number }} playing
 *
 */

/**
 * @typedef {object} ApiSearchResponse
 * @property {ApiTrack[]} tracks
 * @property {ApiTrack[]} artists
 * @property {ApiTrack[]} albums
 */

export const Types = {};
