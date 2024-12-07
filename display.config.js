import dotenv from 'dotenv';
dotenv.config();

export default {
	spotify: {
		client_id: process.env.SPOTIFY_CLIENT_ID,
		client_secret: process.env.SPOTIFY_CLIENT_SECRET
	}
};
