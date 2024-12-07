import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import dotenv from 'dotenv';
import { handler } from '../build/handler.js';
import express from 'express';
import ip from 'ip';
import cors from 'cors';
import { spawn } from 'node:child_process';
import os from 'node:os';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import ApiRoutes from './api.js';
import SpotifyRoutes from './spotify.js';
import { ERROR } from './constants.js';

// const USER_OPTIONS = await import("../display.config.js").then(module => module.default).catch(() => {});

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*'
	}
});

app.use(express.json());
app.use(cors());

const sdk = {
	/** @type {SpotifyApi | null} */
	current: null
};

const comms = (_io) => {
	const methods = {
		message(message, type = 'info') {
			return _io.emit('message', {
				type,
				message
			});
		},
		error(message) {
			return methods.message(`Error: ${message}`, 'error');
		}
	};

	return methods;
};

app.use((req, res, next) => {
	req.sdk = sdk.current;
	req.io = io;
	req.comms = comms(io);
	next();
});

// io.on('connection', (socket) => {
// 	console.log('a user connected');
// });

const sdkProtect = (req, res, next) => {
	if (!req.sdk) {
		return res.json({
			error: true,
			message: ERROR.UNAUTHENTICATED
		});
	}

	next();
};

const spotify = await SpotifyRoutes(sdk, (item) => io.emit('message', item));
app.use('/spotify', spotify);
app.use('/api', sdkProtect, ApiRoutes());

// // let SvelteKit handle everything else, including serving prerendered pages and static assets
if (process.env.NODE_ENV === 'production') {
	app.use(handler);
} else {
	app.get('/player', (req, res) => res.redirect('http://localhost:5173/player'));
}

app.use((err, req, res, next) => {
	console.error(err);
	return res.json({
		error: true,
		message: ERROR.GENERAL
	});
});

function ExecuteChromium() {
	spawn(`/usr/bin/chromium-browser`, [
		'--start-maximized',
		'--kiosk',
		'--noerrdialogs',
		'--disable-infobars',
		'--no-first-run',
		`http://${ip.address()}:${PORT}/player`
	]);
}

server.listen(PORT, () => {
	console.log(`Server listening on port http://${ip.address()}:${PORT}`);

	if (os.platform() === 'linux') {
		ExecuteChromium();
	}
});
