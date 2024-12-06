import ip from 'ip';

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

	return {
		live: !!server,
		url: ip.address(),
		port: url.port
	};
}
