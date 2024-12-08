<script>
	import Controls from '$lib/components/Controls.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import MediaItem from '$lib/components/MediaItem.svelte';
	import PlayingTracker from '$lib/components/PlayingTracker.svelte';
	import ResultsList from '$lib/components/ResultsList.svelte';
	import { api, config } from '$lib/store';
	import { toastItems } from '$lib/toast';
	import * as Types from '$server/types';
	import { CaretBack, Sparkles } from 'svelte-ionicons';

	/** @type {Types.ApiSearchResponse | null}*/
	let items = $state(null);
	let loading = $state(false);

	/** @type {'tracks' | 'artists' | 'albums'}*/
	let expanded = $state('tracks');

	/** @type {Types.ApiNormalisedItem | null} */
	let contextHeader = $state(null);

	/** @type {Types.ApiInfoResponse | null} */
	let playing = $state(null);

	/**
	 *
	 * @param {() => Promise<Types.ApiSearchResponse>} requestPromise
	 */
	async function onRequest(requestPromise) {
		try {
			loading = true;
			items = null;

			const { tracks, artists, albums } = await requestPromise();

			items = {
				tracks,
				artists,
				albums
			};
		} catch (e) {
			console.error(e);
			toastItems.addItem({
				message: 'There was an error - Try refreshing',
				type: 'error'
			});
		} finally {
			loading = false;
		}
	}

	/** @type {HTMLFormElement | null} */
	let searchForm = $state(null);
	async function onSearch(e) {
		e.preventDefault();

		if (!searchForm) {
			return;
		}

		const fd = new FormData(searchForm);

		const q = fd.get('q')?.toString();

		if (q) {
			contextHeader = null;
			onRequest(() => $api.search(q));
		}
	}

	/**
	 *
	 * @param {string} uri
	 * @param {string} name
	 */
	async function addTrack(uri, name) {
		try {
			loading = true;
			await $api.addTrack(uri, name);
		} catch (e) {
			console.error(e);
		} finally {
			loading = false;
		}
	}

	/**
	 *
	 * @param {Types.ApiNormalisedItem} item
	 */
	async function searchAlbum(item) {
		contextHeader = item;
		onRequest(() => $api.album(item.id));
		expanded = 'tracks';
	}

	/**
	 *
	 * @param {Types.ApiNormalisedItem} item
	 */
	async function searchArtist(item) {
		contextHeader = item;
		onRequest(() => $api.artist(item.id));
		expanded = 'tracks';
	}
</script>

<PlayingTracker bind:playing />

<div class="page bg-color-bg" class:loading>
	{#if playing && !('noTrack' in playing)}
		<Controls
			playing={playing.isPlaying}
			title={[playing.track.normalised.title, playing.track.normalised.subtitle].join(' - ')}
			canControl={$config.api?.canControl}
		/>
	{/if}

	{#if $config?.api?.canAdd}
		<div class="page-content bg-color-3">
			<form bind:this={searchForm} class="page-content-top" onsubmit={onSearch}>
				<label>
					<input
						class="color-bg"
						type="search"
						placeholder="URL, Track, Album, Artist..."
						name="q"
						disabled={loading}
					/>
				</label>
				<button class="btn-reset" disabled={loading}>Search</button>
			</form>

			<div class="page-content-results">
				{#if loading}
					<LoadingIndicator floating />
				{/if}

				{#if contextHeader}
					<div class="context-header">
						<button onclick={onSearch} class="context-header-action btn-reset">
							<CaretBack size="28" />
						</button>

						<div class="context-header-item">
							<MediaItem {...contextHeader} />
						</div>
					</div>
				{/if}

				{#if items?.tracks}
					<ResultsList
						title="Tracks"
						onActivate={() => (expanded = 'tracks')}
						expanded={expanded === 'tracks'}
						items={items.tracks}
					>
						{#snippet action(item)}
							<button
								disabled={loading}
								onclick={() => addTrack(item.uri, item.title)}
								class="btn-reset select-track size-small-1">Add Track</button
							>
						{/snippet}
					</ResultsList>
				{/if}

				{#if items?.albums}
					<ResultsList
						title="Albums"
						onActivate={() => (expanded = 'albums')}
						expanded={expanded === 'albums'}
						items={items.albums}
					>
						{#snippet action(item)}
							<button
								onclick={() => searchAlbum(item)}
								disabled={loading}
								class="btn-reset select-track size-small-1">View Album</button
							>
						{/snippet}
					</ResultsList>
				{/if}

				{#if items?.artists}
					<ResultsList
						title="Artists"
						onActivate={() => (expanded = 'artists')}
						expanded={expanded === 'artists'}
						items={items.artists}
					>
						{#snippet action(item)}
							<button
								onclick={() => searchArtist(item)}
								disabled={loading}
								class="btn-reset select-track size-small-1">View Artist</button
							>
						{/snippet}
					</ResultsList>
				{/if}

				{#if !items}
					<div class="initial color-1">Search for a track to add</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="warning">
			<Sparkles />
			<p>Host has disabled adding for this party</p>
		</div>
	{/if}
</div>

<style lang="scss">
	.page {
		padding: var(--spacing-large);

		width: 100vw;
		height: 100dvh;

		display: flex;

		flex-direction: column;

		justify-content: stretch;
		align-items: center;
		gap: var(--spacing-large);

		transition: {
			duration: 0.5s;
			property: background-color;
		}

		&-content {
			flex: 1;

			border-radius: var(--border-radius-large);
			overflow: hidden;
			isolation: isolate;

			max-width: 400px;

			display: grid;

			grid-template-rows: auto 1fr;
		}
	}

	.page-content-top {
		display: flex;

		label {
			flex: 1;

			input {
				width: 100%;

				padding: var(--spacing-normal);
				margin: 0;
				border: none;
				font-weight: inherit;
				outline: 0;
				background-color: var(--color-3);
				color: var(--color-1);
				border-radius: 0;
				font-size: var(--font-size-level-headline-3);

				@media screen and (min-width: 768px) {
					font-size: var(--font-size-level-headline-2);
				}

				&::placeholder {
					color: var(--color-1);
				}

				&:focus {
					background-color: var(--color-2);
				}
			}
		}

		button {
			font-weight: inherit;

			padding: var(--spacing-normal) var(--spacing-large);

			background-color: var(--color-highlight);
			color: var(--color-1);
		}
	}

	.page-content-results {
		min-height: 0;

		display: grid;

		.loading & {
			opacity: 0.5;
		}
	}

	.select-track {
		background-color: var(--color-1);
		color: var(--color-bg);

		border-radius: var(--border-radius-normal);
		padding: var(--spacing-small) var(--spacing-normal);

		&:hover,
		&:focus-visible {
			background-color: var(--color-2);
		}
	}

	.initial {
		display: flex;

		align-items: center;
		justify-content: center;
	}

	.context-header {
		--media-image: 28px;
		--media-font-size: var(--font-size-level-small-2);

		background-color: var(--color-1);
		border-top: 1px solid var(--color-bg);
		border-bottom: 1px solid var(--color-bg);
		color: var(--color-bg);

		display: grid;

		grid-template-columns: 38px 1fr;
		gap: var(--spacing-small);

		&-action {
			display: flex;

			justify-content: center;
			align-items: center;
			line-height: 0;

			background-color: var(--color-3);
			color: var(--color-1);
			aspect-ratio: 1;
		}

		&-item {
			padding: var(--spacing-small);
		}
	}

	.warning {
		border-radius: var(--border-radius-large);
		background-color: var(--color-1);
		color: var(--color-2);

		padding: var(--spacing-large);

		display: flex;

		flex-direction: column;
		align-items: center;
	}
</style>
