import QRCode from 'qrcode-svg';

export const qr = (node, { url, ...rest }) => {
	// the node has been mounted in the DOM

	$effect(() => {
		var svg = new QRCode({
			color: 'currentColor',
			background: 'transparent',
			padding: 0,
			join: true,
			container: 'svg-viewbox',
			...rest,
			content: url
		}).svg();

		node.innerHTML = svg;

		return () => {
			node.innerHTML = '';
		};
	});
};
