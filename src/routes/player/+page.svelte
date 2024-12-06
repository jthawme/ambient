<script>
	import Vibrant from 'node-vibrant';
	import { qr } from '$lib/actions/qr.svelte';
	import { address, api } from '$lib/store';
	import { fade } from 'svelte/transition';
	import ImageLoad from '$lib/components/ImageLoad.svelte';

	/** @type {{ data: import('./$types').PageData }} */
	let { data } = $props();

	let playing = $state(null);

	/** @type {{'--color-1'?: string,'--color-2'?: string,'--color-3'?: string,'--color-bg'?: string}} */
	let palette = $state({});
	let paletteString = $derived(
		Object.entries(palette)
			.map((item) => item.join(':'))
			.join(';')
	);

	let subtitle = $derived.by(() => {
		if (!playing) {
			return '';
		}

		if (!playing.isPlaying) {
			return 'Paused';
		}

		switch (playing.context.type) {
			case 'album':
				return [playing.track.number, playing.context.total].join(' – ');
			default:
				return playing?.context?.normalised.subtitle ?? '';
		}
	});

	async function getPalette(image) {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = image; // + '?not-from-cache-please';

		const palette = await Vibrant.from(img).getPalette();

		return {
			'--color-1': palette.LightVibrant.hex,
			'--color-2': palette.DarkVibrant.hex,
			'--color-3': palette.Muted.hex,
			'--color-bg': palette.DarkMuted.hex
		};
	}

	async function getPlaying() {
		const data = await $api.info();

		if (data?.track?.uri !== playing?.track?.uri) {
			// is different

			if (data?.track?.normalised) {
				palette = await getPalette(data.track.normalised.image.low.url);
			}
		}

		playing = data;
	}

	function automateLoop() {
		const run = async () => {
			await getPlaying();
			int.current = setTimeout(run, 5000);
		};
		const int = { current: 0 };

		run();

		return () => {
			clearTimeout(int.current);
		};
	}

	$effect(() => {
		return automateLoop();
	});
</script>

{#if !playing}
	Loading
{:else}
	<div class="page bg-color-bg" style={paletteString}>
		<div class="top">
			<div class="context color-1">
				<span>{playing?.context.normalised.title}</span>
				<span class="size-small-2">{subtitle}</span>
			</div>
		</div>

		<div class="middle">
			{#key playing.track.normalised.image.full.url}
				<span transition:fade>
					<ImageLoad
						full={playing.track.normalised.image.full.url}
						low={playing.track.normalised.image.low.url}
					/>
				</span>
			{/key}
		</div>

		<div class="bottom">
			<div class="left color-1">
				<h1 class="title">{playing.track.normalised.title}</h1>
				<span class="headline-3">{playing.track.normalised.subtitle}</span>
			</div>

			<div class="right">
				<div class="badge bg-color-3 color-bg">
					<span class="headline-3">Add</span>

					<span class="badge-qr" use:qr={{ url: $address.get('/') }}></span>
				</div>

				<span class="size-small-1 color-3">{$address.naked}</span>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.page {
		display: grid;

		grid-template-rows: auto 1fr auto;
		gap: var(--spacing-large);

		width: 100vw;
		height: 100dvh;

		transition: {
			duration: 0.5s;
			property: background-color;
		}
	}

	.top {
		display: flex;

		justify-content: center;
		align-items: center;

		padding: var(--spacing-large);
	}

	.middle {
		display: grid;

		grid-template-columns: 1fr;
		grid-template-rows: 1fr;

		min-height: 0;
		padding: var(--spacing-x-large);

		@media (orientation: landscape) {
			padding: var(--spacing-large);
		}

		span {
			grid-column: 1;
			grid-row: 1;

			min-height: 0;
		}

		:global(img) {
			width: 100%;
			height: 100%;
			min-height: 0;
			min-width: 0;

			object-fit: contain;
		}
	}

	.context {
		display: flex;

		flex-direction: column;

		align-items: center;
	}

	.bottom {
		display: grid;

		grid-template-columns: 1fr auto;
		gap: var(--spacing-large);

		justify-content: space-between;
		align-items: flex-start;

		padding: var(--spacing-large);

		.badge {
			display: grid;

			grid-template-columns: 1fr 50px;
			gap: var(--spacing-small);

			align-items: center;

			padding: var(--spacing-small);

			border-radius: var(--border-radius-normal);

			min-width: 150px;

			&-qr {
				line-height: 0;
			}
		}

		.left {
			display: flex;

			flex-direction: column;
			align-items: flex-start;

			gap: var(--spacing-small);

			flex: 1;
			min-width: 0;

			.title {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				width: 100%;
			}
		}

		.right {
			display: flex;

			flex-direction: column;
			align-items: flex-end;

			gap: var(--spacing-small);
		}
	}
</style>
