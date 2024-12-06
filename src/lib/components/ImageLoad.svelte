<script>
	const { full, low } = $props();

	const LOAD_STATE = {
		INITIAL: 0,
		LOAD: 1,
		FULL: 2,
		COMPLETE: 3
	};

	let loadState = $state();

	function onLowLoad() {
		if (loadState === LOAD_STATE.INITIAL) {
			loadState = LOAD_STATE.LOAD;
		}
	}

	function onFullLoad() {
		console.log('on full load');
		loadState = LOAD_STATE.FULL;
	}

	let mounted = $state(false);

	$effect(() => {
		mounted = true;
	});
</script>

<span
	class="image"
	class:display={loadState === LOAD_STATE.FULL || loadState === LOAD_STATE.COMPLETE}
>
	{#if loadState !== LOAD_STATE.INITIAL && mounted}
		<img
			class="full"
			src={full}
			onload={onFullLoad}
			alt=""
			ontransitionend={() => (loadState = LOAD_STATE.COMPLETE)}
		/>
	{/if}

	{#if loadState !== LOAD_STATE.COMPLETE}
		<img class="low" src={low} onload={onLowLoad} alt="" />
	{/if}
</span>

<style lang="scss">
	.image {
		display: inline-grid;

		grid-template-columns: 1fr;
		grid-template-rows: 1fr;

		line-height: 0;

		width: 100%;
		height: 100%;

		img {
			grid-column: 1;
			grid-row: 1;
		}
	}

	.full {
		opacity: 0;

		transition: {
			duration: 0.5s;
			property: opacity;
		}

		.display & {
			opacity: 1;
		}
	}
</style>
