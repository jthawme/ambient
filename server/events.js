import EventEmitter from 'node:events';
import { EVENT } from './constants.js';

class AppEventEmitter extends EventEmitter {
	constructor() {
		super();
	}

	/**
	 *
	 * @param {string} eventName
	 * @param {string} message
	 * @param {Record<any, any>} [data]
	 */
	emit(eventName, message, data = {}) {
		super.emit(eventName, {
			message,
			data,
			hooked: true
		});
	}

	error(message, detail = null) {
		this.emit(EVENT.APP_ERROR, message, detail);
	}

	system(event) {
		this.emit([EVENT.SYSTEM, event].join(':'));
	}
}

export const events = new AppEventEmitter();
