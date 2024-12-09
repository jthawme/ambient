<script>
	import { qr } from '$lib/actions/qr.svelte';
	import { address, api, config } from '$lib/store';
	import { fade } from 'svelte/transition';
	import ImageLoad from '$lib/components/ImageLoad.svelte';
	import PlayingTracker from '$lib/components/PlayingTracker.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import * as DataTypes from '$server/types/data.js';
	import { listenCb } from '$lib/utils';

	/**
	 * @type {DataTypes.ApiInfoResponse | null | {noTrack: boolean}}
	 */
	let playing = $state(null);

	let title = $derived.by(() => {
		if (!playing || 'noTrack' in playing) {
			return '';
		}

		if ('normalised' in playing.context) {
			return playing.context.normalised.title;
		}

		if ('album' in playing.track) {
			return playing.track.album;
		}

		if ('show' in playing.track) {
			return playing.track.show;
		}

		return '';
	});

	let subtitle = $derived.by(() => {
		if (!playing || 'noTrack' in playing) {
			return '';
		}

		if (!playing.isPlaying) {
			return 'Paused';
		}

		switch (playing.context?.type) {
			case 'album':
				return [playing.track.number, playing.context.total].join(' – ');
			default:
				return playing?.context?.normalised?.subtitle ?? '';
		}
	});

	/** @type {null | (() => void)} */
	let focusEvt = null;
	async function keepScreenAwake() {
		let wakeLock = null;

		try {
			focusEvt?.();
			focusEvt = null;
			wakeLock = await navigator.wakeLock.request('screen');
			console.log('Screen locked');
			return () => {};
		} catch (err) {
			if (err.code === 0 && !focusEvt) {
				focusEvt = listenCb(window, 'focus', keepScreenAwake);
				return focusEvt;
			} else {
				console.log(err);
			}
		}
	}

	let idle = $state(true);
	function mouseIdle() {
		let timerId = 0;
		const unlisten = listenCb(document, 'mousemove', () => {
			clearTimeout(timerId);
			idle = false;

			timerId = window.setTimeout(() => {
				idle = true;
			}, 2000);
		});

		return () => {
			unlisten();
			clearTimeout(timerId);
		};
	}

	$effect(() => {
		document.documentElement.classList.toggle('idle', idle);
	});

	$effect(() => {
		keepScreenAwake();
		mouseIdle();
	});
</script>

<PlayingTracker bind:playing />

{#if !playing}
	<LoadingIndicator floating />
{:else if 'noTrack' in playing}
	<div class="empty bg-color-3 color-1">No Track playing currently</div>
{:else}
	<div class="page bg-color-bg" class:idle>
		<div class="top">
			<div class="context color-1">
				<span>{title}</span>
				<span class="size-small-2">{subtitle}</span>
			</div>
		</div>

		<div class="middle">
			<div class="middle-image">
				{#key playing.track.normalised.image.full.url}
					<span transition:fade>
						<ImageLoad
							full={playing.track.normalised.image.full.url}
							low={playing.track.normalised.image.low.url}
						/>
					</span>
				{/key}
			</div>
		</div>

		<div class="bottom">
			<div class="left color-1">
				<h1 class="title ellipsis">{playing.track.normalised.title}</h1>
				<span class="headline-3">{playing.track.normalised.subtitle}</span>
			</div>

			<div class="right">
				{#if $config.api?.canAdd}
					<div class="badge bg-color-3 color-bg">
						<span class="headline-3">Add</span>

						<span class="badge-qr" use:qr={{ url: $address.get('/') }}></span>
					</div>
				{/if}

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
		min-height: 0;

		display: grid;

		grid-template-columns: 1fr;

		&-image {
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
				width: 100%;
				line-height: 1.2;
				margin-bottom: -0.1em;
			}
		}

		.right {
			display: flex;

			flex-direction: column;
			align-items: flex-end;
			align-self: flex-end;

			gap: var(--spacing-small);
		}
	}

	.empty {
		position: absolute;

		top: 50%;
		left: 50%;

		transform: translate3d(-50%, -50%, 0);

		padding: var(--spacing-normal);
		border-radius: var(--border-radius-normal);

		white-space: nowrap;
	}
</style>
