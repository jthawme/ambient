import { derived, writable } from 'svelte/store';

export const liveData = writable(false);
export const endpoint = derived([liveData], ([$liveData]) => {
	return $liveData ? '' : 'http://localhost:3000';
});
export const authenticated = writable(false);
export const siteUrl = writable('');
export const sitePort = writable('');

const objectHasValues = (obj) => Object.values(obj).length > 0;

export const api = derived([endpoint], ([$endpoint]) => {
	/**
	 *
	 * @param {string} route
	 * @param {Record<string, any>} [data]
	 * @param {RequestInit} opts
	 */
	const f = async (route, data = {}, opts = {}) => {
		try {
			const url = new URL(
				[$endpoint.startsWith('http') ? '' : window.location.origin, $endpoint, '/api', route].join(
					''
				)
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
			console.log('Api Error');

			throw e;
		}
	};

	return {
		health() {
			return f('/health');
		},
		info() {
			return f('/info');
		}
	};
});

export const address = derived(
	[endpoint, siteUrl, sitePort],
	([$endpoint, $siteUrl, $sitePort]) => {
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

			/**
			 *
			 * @param {string} route
			 * @returns {string}
			 */
			endpoint(route) {
				return `${$endpoint}${route}`;
			}
		};
	}
);
