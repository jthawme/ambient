/**
 * @typedef {object} ApiOptions
 * @property {import('@spotify/web-api-ts-sdk').Market} market If you want to change the market in which many operations happen in
 * @property {number} searchQueryLimit The max amount of tracks to return in any search request
 * @property {boolean} centralisedPolling The server will poll for the spotify info, instead of all of the clients doing it, to reduce chance of rate limit
 * @property {number} centralisedPollingTimer The interval for polling
 * @property {boolean} canAdd Can add to the queue
 * @property {boolean} canControl Can control the playback
 */

/**
 * @typedef {object} SpotifyOptions
 * @property {string} client_id
 * @property {string} client_secret
 * @property {string} origin The root url of the app, used for the redirect_uri passed to spotify
 * @property {string} routePrefix The prefixed sub route that the spotify mounting sits on
 * @property {string} routeToken The route in which spotify redirects to do the exchange of code for access token
 * @property {string} authenticatedRedirect The route to redirect to after the app is authenticated
 * @property {string} accessTokenJsonLocation The path to save the access token file, for caching
 * @property {string[]} scope The scope
 *
 */

/**
 * @typedef {object} SpotifyAccessToken
 * @property {string} refresh_token
 * @property {string} access_token
 * @property {string} token_type
 * @property {number} expires_in
 * @property {string} scope
 */

/**
 * @typedef {object} CommsItem
 * @property {string} message
 * @property {'info' | 'track' | 'error'} type
 */

/**
 * @typedef {object} SpotifyAmbientDisplayOptions
 * @property {number} port
 * @property {boolean} verbose
 * @property {ApiOptions} api
 * @property {SpotifyOptions} spotify
 */

/**
 * @typedef {object} Config
 * @property {number} [port]
 * @property {Partial<ApiOptions>} [api]
 * @property {Partial<SpotifyOptions>} [spotify]
 */

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
