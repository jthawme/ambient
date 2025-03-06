import { SpotifyApi } from '@spotify/web-api-ts-sdk';

import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import { ERROR, EVENT } from './constants.js';
import * as Types from './types/options.js';
import { events } from './events.js';
import { comms } from './comms.js';

import ApiRoutes from './api/index.js';
import SpotifyRoutes from './spotify/index.js';
import { SpotifyInteract } from './api/interact.js';
import { OPTIONS } from './config.js';
import { CommandHistory } from './history.js';

const URL = `${OPTIONS.origin}:${OPTIONS.port}`;

if (OPTIONS.verbose) {
	console.log(OPTIONS);
}

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*'
	}
});
const commsObject = comms(io);

app.use(express.json());
app.use(cors());

/**
 * A mutable object, to which we can attach the spotify instance onto
 */
const sdk = {
	/** @type {SpotifyApi | null} */
	current: null
};

const history = CommandHistory();

const { plugins, ...config } = OPTIONS;
const inject = {
	io,
	comms: commsObject,
	server: app,
	events,
	sdk,
	spotify: SpotifyInteract,
	config,
	history,
	info: {
		url: URL,
		player: [URL, OPTIONS.playerRoute].join('')
	}
};

if (OPTIONS.plugins.length > 0) {
	if (OPTIONS.verbose) {
		console.log('Starting to initialise plugins');
	}

	await Promise.all(
		OPTIONS.plugins
			.filter((plugin) => {
				if (plugin.skip && OPTIONS.verbose) {
					console.log(`Skipping plugin: ${plugin.name ?? 'Unnamed'}`);
				}
				return !plugin.skip;
			})
			.map((plugin) => Promise.resolve().then(() => plugin.handler(inject)))
	);
	if (OPTIONS.verbose) {
		console.log('Finished initialising plugins');
	}
} else if (OPTIONS.verbose) {
	console.log('No plugins listed');
}

/**
 * Middleware which attachs the spotify intance and the socket io instance
 */
app.use((req, res, next) => {
	req.history = history;
	req.sdk = sdk.current;
	req.io = io;
	req.comms = commsObject;
	next();
});

/**
 * A middleware for routes that require the spotify sdk
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const sdkProtect = (req, res, next) => {
	if (!req.sdk) {
		return res.json({
			error: true,
			message: ERROR.UNAUTHENTICATED
		});
	}

	next();
};

// Mount the spotify sub app
const spotify = await SpotifyRoutes(sdk, OPTIONS);
app.use('/spotify', spotify);

// Mount the api sub app
app.use('/api', sdkProtect, ApiRoutes(io, sdk, OPTIONS.api ?? {}));

// If the app is running in development mode, catch the player redirect and redirect to the sveltekit route instead
if (process.env.NODE_ENV === 'development') {
	app.get(OPTIONS.playerRoute, (req, res) => res.redirect('http://localhost:5173/player'));
} else {
	// If its production mount the built sveltekit app
	const { handler } = await import('../build/handler.js');
	app.use(handler);
}

app.use((req, res, next) => {
	// events.error(ERROR.GENERAL, err);
	if (process.env.NODE_ENV === 'development') {
		return res.redirect(`http://localhost:5173${req.baseUrl}`);
	}

	return res.json({
		error: true,
		message: ERROR.GENERAL
	});
});

events.on(EVENT.APP_ERROR, ({ message, detail }) => {
	if (!OPTIONS.suppressErrors.includes(message)) {
		commsObject.error(message);
		console.error(message, detail);
	}
});

events.on(`system:authenticated`, () => {
	io.emit('reload');
});

export default {
	inject,
	server,
	start() {
		server.listen(OPTIONS.port, () => {
			console.log(`App running on port ${URL}`);
			events.system('start');
		});
	}
};
