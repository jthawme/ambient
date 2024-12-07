<script>
	import { api } from '$lib/store';
	import Vibrant from 'node-vibrant';

	/** @type {{'--color-1'?: string,'--color-2'?: string,'--color-3'?: string,'--color-bg'?: string}} */
	let palette = $state({});

	$effect(() => {
		Object.entries(palette).forEach(([prop, value]) => {
			document.documentElement.style.setProperty(prop, value);
		});
	});

	let { playing = $bindable(null) } = $props();

	async function getPalette(image) {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = image; // + '?not-from-cache-please';

		const palette = await Vibrant.from(img).getPalette();

		return {
			'--color-1': palette.LightVibrant.hex,
			'--color-2': palette.DarkVibrant.hex,
			'--color-3': palette.Muted.hex,
			'--color-bg': palette.DarkMuted.hex,
			'--color-highlight': palette.Vibrant.hex
		};
	}

	async function getPlaying() {
		const data = await $api.info();

		if (data?.track?.uri !== playing?.track?.uri) {
			// is different

			if (data?.track?.normalised) {
				palette = await getPalette(data.track.normalised.image.low.url);
			}
		}

		playing = data;
	}

	function automateLoop() {
		const run = async () => {
			await getPlaying();
			int.current = setTimeout(run, 5000);
		};
		const int = { current: 0 };

		run();

		return () => {
			clearTimeout(int.current);
		};
	}

	$effect(() => {
		return automateLoop();
	});
</script>
