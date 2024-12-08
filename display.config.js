import dotenv from 'dotenv';
dotenv.config();

/** @type {import('./server/types.js').SpotifyAmbientDisplayOptions} */
export default {
	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	}
};
