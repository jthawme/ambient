import { io, Socket } from 'socket.io-client';
import { derived } from 'svelte/store';
import { address, settled } from './store';

/** */
const previous = {
	/** @type {Socket | null} */
	current: null
};

export const socket = derived([address, settled], ([$address, $settled]) => {
	if (!settled) {
		return null;
	}

	const i = io($address.endpoint);

	if (previous.current) {
		previous.current.disconnect();
	}

	previous.current = i;

	return i;
});
