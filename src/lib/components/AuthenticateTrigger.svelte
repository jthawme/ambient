<script>
	import { qr } from '$lib/actions/qr.svelte';
	import { address } from '$lib/store';
</script>

<div class="content">
	<div class="options">
		<div class="options-left">
			<h1>This instance is not authenticated</h1>
			<p>
				{$address.server('/spotify/start')}
				<a href={$address.server('/spotify/start')}>Authenticate</a> or scan qr to authenticate via device
			</p>
		</div>
		<div class="options-right">
			<span class="qr" use:qr={{ url: $address.server('/spotify/start') }}></span>
		</div>
		<div class="options-bottom">
			<p class="size-small-1 color-2">
				Make sure that <em>{$address.server('/spotify/token')}</em> is added as a Redirect URI in your
				spotify app dashboard
			</p>
		</div>
	</div>
</div>

<style lang="scss">
	.content {
		position: absolute;

		top: 50%;
		left: 50%;

		width: calc(100% - (var(--spacing-large) * 2));
		max-width: 500px;
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
		gap: var(--spacing-normal);

		&-bottom {
			grid-column: 1 / -1;

			p {
				margin: 0;

				em {
					color: vaR(--color-1);
					font-style: normal;
				}
			}
		}
	}
</style>
