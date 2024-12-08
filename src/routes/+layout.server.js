import { OPTIONS } from '$server/config.js';

const testServer = async (fetch) => {
	try {
		const { success } = await fetch('/api/health').then((resp) => resp.json());

		return success;
	} catch {
		return false;
	}
};

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ fetch }) {
	const server = await testServer(fetch);

	const { plugins, ...config } = OPTIONS;

	return {
		live: !!server,
		config
	};
}
