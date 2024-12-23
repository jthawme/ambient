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
 * @property {string} routePrefix The prefixed sub route that the spotify mounting sits on
 * @property {string} routeToken The route in which spotify redirects to do the exchange of code for access token
 * @property {string} authenticatedRedirect The route to redirect to after the app is authenticated
 * @property {string} accessTokenJsonLocation The path to save the access token file, for caching
 * @property {string[]} scope The scope
 *
 */

/**
 * @typedef {object} PluginItemInject
 * @property {import('socket.io').Server} io
 * @property {import('./comms.js').Comms} comms
 * @property {import('express').Express} app
 * @property {import('../events').AppEventEmitter} events
 * @property {{current: null | import('@spotify/web-api-ts-sdk').SpotifyApi}} sdk
 * @property {import('../api/interact.js').SpotifyInteract} spotify
 * @property {SpotifyAmbientDisplayOptions} config
 * @property {import('../history.js').CommandHistory} history
 * @property {{ url: string, player: string }} info
 *
 */

/**
 * @typedef {object} PluginItem
 * @property {boolean} [skip] Whether or not to skip mounting this plugin. Useful for dev/prod switch
 * @property {string} [name] Plugin name, useful for internals
 * @property {(inject: PluginItemInject) => void} handler
 */

/**
 * @typedef {object} SpotifyAmbientDisplayOptions
 * @property {number} port The root url of the app, used for the redirect_uri passed to spotify
 * @property {string} origin
 * @property {string} protocol
 * @property {string} playerRoute
 * @property {boolean} verbose
 * @property {ApiOptions} api
 * @property {SpotifyOptions} spotify
 * @property {Record<string, any>} pluginOptions
 * @property {string[]} suppressErrors Any error events to catch and not send to the frontend, because perhaps a plugin will handle them
 */

/**
 * @typedef {object} Config
 * @property {number} [port]
 * @property {string} [origin]
 * @property {string} [protocol]
 * @property {string} [playerRoute]
 * @property {boolean} [verbose]
 * @property {Partial<ApiOptions>} [api]
 * @property {Partial<SpotifyOptions>} [spotify]
 * @property {PluginItem[]} [plugins]
 * @property {Record<string, any>} [pluginOptions]
 * @property {string[]} [suppressErrors] Any error events to catch and not send to the frontend, because perhaps a plugin will handle them
 *
 */

export const Types = {};
