<script>
	import { qr } from '$lib/actions/qr.svelte';
	import { address } from '$lib/store';
</script>

<div class="content">
	<div class="options">
		<div class="options-left">
			<h1>This instance is not authenticated</h1>
			<p>
				<a href={$address.endpoint('/spotify/start')}>Authenticate</a> or scan qr to authenticate via
				device
			</p>
		</div>
		<div class="options-right">
			<span class="qr" use:qr={{ url: $address.endpoint('/spotify/start') }}></span>
		</div>
	</div>
</div>

<style lang="scss">
	.content {
		position: absolute;

		top: 50%;
		left: 50%;

		max-width: 500px;
		margin: var(--spacing-large);
		padding: var(--spacing-large);

		transform: translate3d(-50%, -50%, 0);

		background-color: var(--color-3);
		color: var(--color-1);

		border-radius: var(--border-radius-large);

		p {
			margin: 0.5em 0;
			max-width: 65%;
		}

		.qr {
			display: block;
		}
	}

	.options {
		display: grid;

		grid-template-columns: 1fr 100px;
	}
</style>
