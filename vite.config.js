import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
import svg from '@poppanator/sveltekit-svg';
import BuildManifest from './tools/BuildManifest.js';

export default defineConfig({
	server: {
		host: true,
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), './server', './ambient.config.js']
		}
	},
	plugins: [
		sveltekit(),
		svg({
			includePaths: ['./src/lib/icons/'],
			svgoOptions: {
				multipass: true,
				plugins: [
					{
						name: 'preset-default',
						// by default svgo removes the viewBox which prevents svg icons from scaling
						// not a good idea! https://github.com/svg/svgo/pull/1461
						params: { overrides: { removeViewBox: false } }
					},
					{
						name: 'convertColors',
						params: {
							currentColor: true
						}
					},
					{ name: 'removeAttrs', params: { attrs: '(width|height)' } }
				]
			}
		}),

		BuildManifest({
			manifest: {
				name: 'Spotify Party',
				short_name: 'Spotify Party',
				description: 'A frontend for social spotify-ing',
				background_color: '#000'
			}
		})
	]
});
