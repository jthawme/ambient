<script>
	import ImageLoad from './ImageLoad.svelte';

	const { id, image, title, subtitle, uri, action = null } = $props();
</script>

<div class="item" data-id={id} class:withAction={!!action}>
	<div class="item-image">
		<ImageLoad full={image.full.url} low={image.low.url} />
	</div>

	<div class="item-content">
		<span class="item-content-title ellipsis">{title}</span>
		<span class="item-content-subtitle ellipsis color-2">{subtitle}</span>
	</div>

	{#if action}
		<div class="item-action">
			{@render action()}
		</div>
	{/if}
</div>

<style lang="scss">
	.item {
		display: grid;

		align-items: center;
		grid-template-areas: 'image content';
		grid-template-columns: var(--media-image, 64px) 1fr;
		grid-template-rows: auto;
		column-gap: var(--spacing-normal);
		row-gap: var(--spacing-small);

		&.withAction {
			grid-template-areas:
				'image content'
				'image action';
			grid-template-rows: 1fr auto;
			align-items: flex-start;
		}

		&-image {
			grid-area: image;

			isolation: isolate;

			overflow: hidden;
			border-radius: var(--border-radius-normal);

			line-height: 0;

			align-self: flex-start;
		}

		&-content {
			grid-area: content;

			display: flex;

			flex-direction: column;

			min-width: 0;
		}

		&-content-title,
		&-content-subtitle {
			font-size: var(--media-font-size, var(--font-size-body-1));
		}

		&-action {
			grid-area: action;
		}
	}
</style>
