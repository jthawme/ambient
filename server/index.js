import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import dotenv from 'dotenv';
import express from 'express';
import ip from 'ip';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import deepmerge from 'deepmerge';

import { ERROR, EVENT, DEFAULT_OPTIONS } from './constants.js';
import * as Types from './types.js';
import { events } from './events.js';
import { comms } from './comms.js';

import ApiRoutes from './api/index.js';
import SpotifyRoutes from './spotify/index.js';

dotenv.config();

const INJECTED_OPTIONS = {
	port: process.env.PORT ?? 3000,
	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	}
};

/** @type {Partial<Types.SpotifyAmbientDisplayOptions>} */
const USER_OPTIONS = await import('../party.config.js')
	.then((module) => module.default)
	.catch(() => {});

const OPTIONS = deepmerge(INJECTED_OPTIONS, deepmerge(DEFAULT_OPTIONS, USER_OPTIONS));

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

/**
 * Middleware which attachs the spotify intance and the socket io instance
 */
app.use((req, res, next) => {
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
const spotify = await SpotifyRoutes(sdk, { ...(OPTIONS.spotify ?? {}), port: OPTIONS.port });
app.use('/spotify', spotify);

// Mount the api sub app
app.use('/api', sdkProtect, ApiRoutes(io, sdk, OPTIONS.api ?? {}));

// If the app is running in development mode, catch the player redirect and redirect to the sveltekit route instead
if (process.env.NODE_ENV === 'development') {
	app.get(USER_OPTIONS.spotify?.authenticatedRedirect ?? '/player', (req, res) =>
		res.redirect('http://localhost:5173/player')
	);
} else {
	// If its production mount the built sveltekit app
	const { handler } = await import('../build/handler.js');
	app.use(handler);
}

app.use((err, req, res, next) => {
	events.error(ERROR.GENERAL, err);

	return res.json({
		error: true,
		message: ERROR.GENERAL
	});
});

events.on(EVENT.APP_ERROR, ({ message }) => {
	commsObject.error(message);
});

server.listen(OPTIONS.port, () => {
	console.log(`App running on port http://${ip.address()}:${OPTIONS.port}`);

	events.system('start');
});
