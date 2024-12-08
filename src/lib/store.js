import { derived, writable } from 'svelte/store';
import { toastItems } from './toast';

export const liveData = writable(false);
export const authenticated = writable(false);
export const siteUrl = writable('');
export const sitePort = writable('');
export const settled = writable(false);

const objectHasValues = (obj) => Object.values(obj).length > 0;

export const address = derived(
	[liveData, siteUrl, sitePort],
	([$liveData, $siteUrl, $sitePort]) => {
		const full = `${typeof window !== 'undefined' ? window.location.protocol : 'http:'}//${$siteUrl}:${$sitePort}`;

		return {
			full,
			naked: [$siteUrl, $sitePort].join(';'),

			/**
			 *
			 * @param {string} route
			 * @returns {string}
			 */
			get(route) {
				return `${full}${route}`;
			},

			endpoint: $liveData || !$siteUrl ? '' : `http://${$siteUrl}:3000`,

			/**
			 *
			 * @param {string} route
			 * @returns {string}
			 */
			server(route) {
				return `${this.endpoint}${route}`;
			}
		};
	}
);

export const api = derived([address], ([$address]) => {
	/**
	 *
	 * @param {string} route
	 * @param {Record<string, any>} [data]
	 * @param {RequestInit} opts
	 */
	const f = async (route, data = {}, opts = {}) => {
		try {
			const url = new URL(
				[
					$address.endpoint.startsWith('http') ? '' : window.location.origin,
					$address.endpoint,
					'/api',
					route
				].join('')
			);

			if (opts.method === 'POST' && objectHasValues(data)) {
				opts.body = JSON.stringify(data);
			} else if (objectHasValues(data)) {
				url.search = new URLSearchParams(data).toString();
			}

			const resp = await fetch(url, opts);
			const result = await resp.json();

			if (resp.status !== 200) {
				throw new Error(result);
			}

			return result;
		} catch (e) {
			toastItems.addItem({
				message: 'Api Error',
				type: 'error'
			});

			throw e;
		}
	};

	return {
		health() {
			return f('/health');
		},
		info() {
			return f('/info');
		},
		/**
		 *
		 * @param {string} q
		 */
		search(q) {
			return f('/search', { q });
		},
		/**
		 *
		 * @param {string} id
		 */
		artist(id) {
			return f(`/artist/${id}`);
		},
		/**
		 *
		 * @param {string} id
		 */
		album(id) {
			return f(`/album/${id}`);
		},

		/**
		 *
		 * @param {string} uri
		 * @param {string} [name]
		 */
		addTrack(uri, name) {
			return f(`/add`, { uri, name });
		},

		play() {
			return f('/play');
		},

		pause() {
			return f('/pause');
		},

		skipForward() {
			return f('/skipForward');
		},

		skipBackward() {
			return f('/skipBackward');
		}
	};
});
