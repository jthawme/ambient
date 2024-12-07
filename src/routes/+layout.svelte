<script>
	import 'normalize.css';
	import '$lib/styles.scss';
	import { api, authenticated, liveData, settled, sitePort, siteUrl } from '$lib/store';
	import { socket } from '$lib/comms';

	import AuthenticateTrigger from '$lib/components/AuthenticateTrigger.svelte';
	import { address } from '$lib/store';
	import ToastManager from '$lib/components/Toast/Manager.svelte';
	import { toastItems } from '$lib/toast';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';

	/** @type {{ data: import('./$types').LayoutData, children: import('svelte').Snippet }} */
	let { data, children } = $props();

	let loading = $state(true);

	async function determineAppState() {
		const { authenticated: serverAuthenticated = false } = await $api.health();

		authenticated.set(serverAuthenticated);
	}

	$effect(() => {
		console.log($socket);
		$socket?.on('message', (item) => {
			toastItems.addItem(item);
		});
	});

	$effect(() => {
		siteUrl.set(data.url);
		liveData.set(data.live);
		sitePort.set(data.port);
		settled.set(true);

		determineAppState();

		loading = false;
	});
</script>

<svelte:head>
	<title>Spotify Party</title>
	<meta name="description" content="A frontend for social spotify-ing" />

	<meta property="og:title" content="Spotify Party" />
	<meta property="og:description" content="A frontend for social spotify-ing" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={$address.get('/')} />
	<meta property="og:image" content={$address.get('/social.jpg')} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Spotify Party" />
	<meta property="twitter:url" content={$address.get('/')} />
	<meta name="twitter:description" content="A frontend for social spotify-ing" />
	<meta name="twitter:image" content={$address.get('/social.jpg')} />

	<meta name="theme-color" content="#0000000" />

	<link rel="icon" href="/favicon.ico" />
	<link rel="manifest" href="/manifest.json" />
</svelte:head>

{#if loading}
	<LoadingIndicator floating />
{:else if !$authenticated}
	<AuthenticateTrigger />
{:else}
	<ToastManager />
	{@render children()}
{/if}
