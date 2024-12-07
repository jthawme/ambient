<script>
	const { floating = false } = $props();
</script>

<div class="loading" class:floating>
	<div class="loading-icon"></div>
	<div class="loading-icon"></div>
	<div class="loading-icon"></div>
</div>

<style lang="scss">
	@property --loading-size {
		syntax: '<length>';
		inherits: false;
		initial-value: 16px;
	}

	.loading {
		display: inline-grid;

		aspect-ratio: 1;
		align-items: center;
		grid-template-columns: repeat(3, var(--loading-size));

		padding: var(--loading-padding, var(--spacing-small));
		gap: var(--loading-gap, var(--spacing-small));

		background-color: var(--color-1);
		border-radius: var(--border-radius-normal);

		&.floating {
			position: absolute;

			top: 50%;
			left: 50%;

			transform: translate3d(-50%, -50%, 0);

			z-index: 20;
		}
	}

	.loading-icon {
		background-color: var(--color-bg);

		aspect-ratio: 1;

		border-radius: 100%;

		animation: {
			name: BLOAT;
			duration: 1.2s;
			iteration-count: infinite;
			timing-function: var(--easing);
		}

		@for $i from 1 through 3 {
			&:nth-child(#{$i}) {
				animation-delay: 0.15s * ($i - 1);
			}
		}
	}

	@keyframes BLOAT {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
		}
	}
</style>
