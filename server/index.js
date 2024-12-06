import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import dotenv from 'dotenv';
import { handler } from '../build/handler.js';
import express from 'express';
import ip from 'ip';
import cors from 'cors';
import { spawn } from 'node:child_process';
import os from 'node:os';

import ApiRoutes from './api.js';
import SpotifyRoutes from './spotify.js';
import { ERROR } from './constants.js';

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();
app.use(express.json());
app.use(cors());

const sdk = {
	/** @type {SpotifyApi | null} */
	current: null
};

app.use((req, res, next) => {
	req.sdk = sdk.current;
	next();
});

const sdkProtect = (req, res, next) => {
	if (!req.sdk) {
		return res.json({
			error: true,
			message: ERROR.UNAUTHENTICATED
		});
	}

	next();
};

const spotify = await SpotifyRoutes(sdk);
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

app.listen(PORT, () => {
	console.log(`Server listening on port http://${ip.address()}:${PORT}`);

	if (os.platform() === 'linux') {
		ExecuteChromium();
	}
});
