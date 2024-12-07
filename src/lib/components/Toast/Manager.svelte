<script>
	import { toastItems } from '$lib/toast';
	import { flip } from 'svelte/animate';
	import Item from './Item.svelte';
</script>

<div class="manager">
	{#each $toastItems as item (item.id)}
		<div animate:flip>
			<Item onEnd={toastItems.removeItem} {...item} />
		</div>
	{/each}
</div>

<style lang="scss">
	.manager {
		position: fixed;

		top: 0;
		left: 50%;

		transform: translateX(-50%);

		z-index: 10;

		display: flex;

		align-items: center;
		flex-direction: column;
		gap: var(--spacing-normal);

		padding: var(--spacing-normal);
	}
</style>
