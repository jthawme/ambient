<script>
	import MediaItem from './MediaItem.svelte';
	import * as Types from '$lib/types';

	/**
	 * @typedef {object} ResultsListProps
	 * @property {boolean} [expanded]
	 * @property {() => void} onActivate
	 * @property {Types.ApiTrack[]} items
	 * @property {string} title
	 * @property {import('svelte').Snippet<[Types.ApiNormalisedItem]>} action
	 */

	/** @type {ResultsListProps} */
	const { expanded = false, onActivate, items, title, action: ListItemAction } = $props();
</script>

<div class="results-list">
	<button onclick={onActivate} class:active={expanded} class="btn-reset results-list-top"
		>{title}</button
	>
	{#if expanded}
		<div class="results-list-items">
			{#each items as item}
				<MediaItem {...item.normalised}>
					{#snippet action()}
						{@render ListItemAction(item.normalised)}
					{/snippet}
				</MediaItem>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.results-list {
		display: grid;

		grid-template-rows: auto 1fr;

		flex: 1;
		min-height: 0;

		&:not(:last-child) .results-list-items {
			border-bottom: 1px solid var(--color-1);
		}

		&-top {
			padding: var(--spacing-normal);

			border-bottom: 1px solid var(--color-1);

			text-align: left;

			&:not(.active):hover,
			&:not(.active):focus-visible {
				background-color: var(--color-2);
			}

			&.active {
				background-color: var(--color-1);
				color: var(--color-bg);
			}
		}

		&-items {
			padding: var(--spacing-normal);

			overflow: auto;

			min-height: 0;

			display: flex;

			flex-direction: column;

			gap: var(--spacing-normal);
		}
	}
</style>
