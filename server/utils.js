export const mergeOptions = (opts, defaultOptions) => {
	return {
		...defaultOptions,
		...opts
	};
};
