<script>
	import { Pause, Play, PlaySkipBack, PlaySkipForward } from 'svelte-ionicons';
	import { api } from '$lib/store';

	const { playing = false, title, onTrigger = () => {}, canControl = true } = $props();

	/**
	 * A variable to create the illusion of immediate feedback
	 *
	 * @type {boolean | null}
	 */
	let eagerToggle = $state(null);

	let playDisplay = $derived(eagerToggle ?? playing);

	async function onSkipBackward() {
		await $api.skipBackward();
		onTrigger();
	}

	async function onPlay() {
		eagerToggle = true;
		await $api.play();
		onTrigger();
	}

	async function onPause() {
		eagerToggle = false;
		await $api.pause();
		onTrigger();
	}

	async function onSkipForward() {
		await $api.skipForward();
		onTrigger();
	}

	$effect(() => {
		if (typeof playing === 'boolean') {
			eagerToggle = null;
		}
	});
</script>

<div class="controls color-1">
	<div class="controls-top ellipsis">{title}</div>

	{#if canControl}
		<div class="controls-actions">
			<button onclick={onSkipBackward} class="btn-reset">
				<PlaySkipBack />
			</button>
			{#if playDisplay === true}
				<button onclick={onPause} class="btn-reset">
					<Pause />
				</button>
			{:else if playDisplay === false}
				<button onclick={onPlay} class="btn-reset">
					<Play />
				</button>
			{/if}
			<button onclick={onSkipForward} class="btn-reset">
				<PlaySkipForward />
			</button>
		</div>
	{/if}
</div>

<style lang="scss">
	.controls {
		display: flex;

		flex-direction: column;
		align-items: center;

		gap: var(--spacing-normal);

		width: 100%;
		max-width: 400px;

		&-top {
			width: 100%;

			text-align: center;
		}

		:global(svg) {
			fill: currentColor;
		}
	}
</style>
