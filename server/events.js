import EventEmitter from 'node:events';
import { EVENT } from './constants.js';

export class AppEventEmitter extends EventEmitter {
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
			data
		});
	}

	/**
	 *
	 * @param {string} message
	 * @param {any} detail
	 */
	error(message, detail = null) {
		this.emit(EVENT.APP_ERROR, message, detail);
	}

	/**
	 *
	 * @param {string} event
	 * @param {string} message
	 */
	system(event, message = '') {
		this.emit([EVENT.SYSTEM, event].join(':'), message);
	}
}

export const events = new AppEventEmitter();
