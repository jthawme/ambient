/**
 * @typedef {object} ApiNormalisedItem
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {string} uri
 * @property {{full: {url: string},low: {url: string}}} image
 */

/**
 * @typedef {object} ApiTrack
 * @property {ApiNormalisedItem} normalised
 */

/**
 * @typedef {object} ApiInfoResponse
 * @property {boolean} isPlaying
 * @property {ApiTrack} track
 * @property {object} context
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
