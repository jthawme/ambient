<script>
	import { socket } from '$lib/comms';
	import { api } from '$lib/store';
	import Vibrant from 'node-vibrant';
	import * as DataTypes from '$server/types/data.js';

	let {
		playing = $bindable(null),
		polling = false,
		pollingTime = 5000,
		activate = $bindable()
	} = $props();

	/** @type {{'--color-1'?: string,'--color-2'?: string,'--color-3'?: string,'--color-bg'?: string}} */
	let palette = $state({});

	$effect(() => {
		Object.entries(palette).forEach(([prop, value]) => {
			document.documentElement.style.setProperty(prop, value);
		});
	});

	/**
	 *
	 * @param {string} image
	 */
	async function getPalette(image) {
		const img = new Image();
		img.crossOrigin = 'Anonymous';
		img.src = image; // + '?not-from-cache-please';

		const palette = await Vibrant.from(img).getPalette();

		if (!palette) {
			return {};
		}

		return {
			'--color-1': palette.LightVibrant?.hex,
			'--color-2': palette.DarkVibrant?.hex,
			'--color-3': palette.Muted?.hex,
			'--color-bg': palette.DarkMuted?.hex,
			'--color-highlight': palette.Vibrant?.hex
		};
	}

	/**
	 *
	 * @param {DataTypes.ApiInfoResponse} newData
	 */
	async function update(newData) {
		if (newData?.track?.uri !== playing?.track?.uri) {
			// is different

			if (newData?.track?.normalised) {
				palette = await getPalette(newData.track.normalised.image.low.url);
			}
		}

		playing = newData;
	}

	async function getPlaying() {
		const data = await $api.info();

		update(data);
	}

	function automateLoop() {
		const run = async () => {
			await getPlaying();
			int.current = window.setTimeout(run, pollingTime);
		};
		const int = { current: 0 };

		run();

		return () => {
			clearTimeout(int.current);
		};
	}

	$effect(() => {
		if (polling) {
			return automateLoop();
		} else {
			$socket?.on('info', (track) => {
				update(track);
			});
		}

		activate = getPlaying;
	});
</script>
