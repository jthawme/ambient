<script>
	import 'normalize.css';
	import '$lib/styles.scss';
	import { api, authenticated, config, liveData, settled } from '$lib/store';
	import { socket } from '$lib/comms';

	import AuthenticateTrigger from '$lib/components/AuthenticateTrigger.svelte';
	import { address } from '$lib/store';
	import ToastManager from '$lib/components/Toast/Manager.svelte';
	import { toastItems } from '$lib/toast';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';

	/** @type {{ data: import('./$types').LayoutData, children: import('svelte').Snippet }} */
	let { data, children } = $props();

	let loading = $state(true);
	let appStateTimer = $state(0);

	async function determineAppState() {
		clearTimeout(appStateTimer);

		try {
			const { authenticated: serverAuthenticated = false } = await $api.health();

			authenticated.set(serverAuthenticated);
		} catch (e) {
			authenticated.set(false);

			// Recheck periodically
			appStateTimer = window.setTimeout(() => {
				determineAppState();
			}, 5000);
		}
	}

	$effect(() => {
		$socket?.on('message', (item) => {
			toastItems.addItem(item);

			if (item.message.contains('spotify/reauthenticate')) {
				determineAppState();
			}
		});
		$socket?.on('reload', (item) => {
			window.location.reload();
		});
	});

	$effect(() => {
		config.set(data.config);
		liveData.set(data.live);
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
