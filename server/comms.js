export const comms = (io) => {
	return {
		message(message, type = 'info') {
			return io.emit('message', {
				type,
				message
			});
		},
		error(message) {
			return this.message(`Error: ${message}`, 'error');
		}
	};
};
