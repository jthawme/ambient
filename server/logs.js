import bunyan from 'bunyan';

export const log = bunyan.createLogger({
	name: 'SpotifyParty',
	streams: [
		// {
		// 	level: 'debug',
		// 	stream: process.stdout // log INFO and above to stdout
		// },
		{
			level: 'error',
			path: './error.logs.json' // log ERROR and above to a file
		}
	]
});
