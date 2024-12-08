import deepmerge from 'deepmerge';
import ip from 'ip';
import { DEFAULT_OPTIONS } from '$server/constants.js';

const testServer = async (fetch) => {
	try {
		const { success } = await fetch('/api/health').then((resp) => resp.json());

		return success;
	} catch {
		return false;
	}
};

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch, url }) {
	const server = await testServer(fetch);

	const { default: config } = await import('$config');

	return {
		live: !!server,
		url: ip.address(),
		port: url.port,
		config: deepmerge(DEFAULT_OPTIONS, config)
	};
}
