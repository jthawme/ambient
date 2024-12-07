<script>
	import { fade, fly } from 'svelte/transition';

	import { Disc, InformationCircle, Warning } from 'svelte-ionicons';

	const { id, message, type = 'info', time = 2500, onEnd } = $props();

	let timerId = $state(0);

	$effect(() => {
		return () => clearTimeout(timerId);
	});

	function startTimer() {
		timerId = window.setTimeout(() => {
			onEnd(id);
		}, time);
	}
</script>

<div in:fly={{ y: -50 }} out:fade onintroend={startTimer} class="item bg-color-3 color-bg">
	<div class="item-icon">
		{#if type === 'track'}
			<Disc />
		{/if}
		{#if type === 'info'}
			<InformationCircle />
		{/if}
		{#if type === 'error'}
			<Warning />
		{/if}
	</div>

	<div class="item-message size-small-2">
		{@html message}
	</div>
</div>

<style lang="scss">
	.item {
		display: grid;

		grid-template-columns: 32px 1fr;

		align-items: center;

		gap: var(--spacing-small);

		max-width: 250px;

		padding: var(--spacing-small);
		border-radius: var(--border-radius-normal);

		&-icon {
			line-height: 0;

			:global(svg) {
				fill: currentColor;
			}
		}

		&-message {
			padding-right: var(--spacing-normal);

			:global(em) {
				font-style: normal;
				color: var(--color-bg);
			}
		}
	}
</style>
