# Ambient

An ambient display screen for spotify, with the configurable ability to also non destructively add songs to the communal queue and control basic playback.

![Screenshot](./screenshot.png?raw=true 'Screenshot of the player')

[Watch a userful video here](https://www.youtube.com/watch?v=0QEBUVzqkY0)

## Like a Spotify Jam?

Yeah pretty much, in fact much worse. But in _some_ ways better. Gives a more 'there is a Spotify instance running by the host, but if you wanna chuck a couple tunes in, go for it' vibe, rather than full control.

It also protects against the DREADED playlist switch. It then also allows the host to disallow jams, it just turns the tighten up a very little amount.

## Installing and running

### Option 1: Pull the project locally

```
npm run build // or any package manager of course

node server/run.js
```

This will build the sveltekit project and then run the express server

### Option 2: Install in another project [COMING SOON]

Hopefully

## Config

You can configure Ambient with an `ambient.config.js` file in the root of the folder. All types can be found in [this folder](/server/types/)

| Key                             | Type         | Description                                                                                       | Default                             |
| ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| port                            | number       | The port in which the server runs on                                                              | `3000`                              |
| origin                          | string       | The origin of the server, usually the local ip                                                    | `_Your machine's IP address_`       |
| protocol                        | string       | http:// or https:// (is there another?!)                                                          | `http://`                           |
| playerRoute                     | string       | The path that the player is routed on                                                             | `/player`                           |
| verbose                         | boolean      | Whether the app shouts a lot more in the stdout                                                   | `false`                             |
| api                             | object       | See below                                                                                         |                                     |
| api.market                      | string       | The spotify market to use a lot of the functions in                                               | `GB`                                |
| api.searchQueryLimit            | number       | How many search results of each category to display                                               | `10`                                |
| api.centralisedPolling          | boolean      | Whether to turn the info call onto the server and communicate via websockets                      | `true`                              |
| api.centralisedPollingTimer     | number       | The internal timer that calls for the info                                                        | 5000                                |
| api.canAdd                      | boolean      | Gives users the ability to add to the playback via the dashboard                                  | `true`                              |
| api.canControl                  | boolean      | Gives users the ability to control the playback                                                   | `true`                              |
| spotify                         | object       | See below                                                                                         |                                     |
| spotify.client_id               | string       | The spotify Client ID from your app                                                               | `process.env.SPOTIFY_CLIENT_ID`     |
| spotify.client_secret           | string       | The spotify Client Secret from your app                                                           | `process.env.SPOTIFY_CLIENT_SECRET` |
| spotify.routePrefix             | string       | The prefixed sub route that the spotify mounting sits on                                          | `/spotify`                          |
| spotify.routeToken              | string       | The path that spotify redirects to with the token                                                 | `/token`                            |
| spotify.authenticatedRedirect   | string       | The route that the app redirects too after a successful auth with spotify                         | `/`                                 |
| spotify.accessTokenJsonLocation | string       | The path to save the access token file, for caching                                               | `./server/spotify_auth.json`        |
| spotify.scope                   | string[]     | Any additional scopes to initiate spotify with                                                    | `[]`                                |
| plugins                         | PluginItem[] | An array of [plugins](#plugins) to run                                                            | `[]`                                |
| pluginOptions                   | object       | Refer to any plugin options for what to place here                                                | `{}`                                |
| suppressErrors                  | string[]     | Any error events to catch and not send to the frontend, because perhaps a plugin will handle them | `[]`                                |

## Plugins

| Name                                                                | Description                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Kiosk Mode](https://github.com/jthawme/ambient-kiosk-mode)         | Opens fullscreen kiosk mode of app after running                                      |
| [Sonos Fallback](https://github.com/jthawme/ambient-sonos-fallback) | Controls sonos directly, if spotify's api errors while using Sonos as playback device |

## Reasoning

Spotify's API is excellent, but without being approved for the expanded API grant, its limited to really only hobbyist stuff. This means that you can register your own app, and run this locally and have a customised Spotify Jam scenario, because its running through your credentials. Locally served
