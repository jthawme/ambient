/**
 * @typedef {object} CommandHistory
 * @property {CommandHistoryItem[]} items
 * @property {CommandHistoryItem | undefined} last
 * @property {(item: CommandHistoryItem) => CommandHistory} add
 */

/**
 * @typedef {{type: string} & Record<string, any>} CommandHistoryItem
 */

/**
 *
 * @param {number} [size]
 * @returns {CommandHistory}
 */
export const CommandHistory = (size = 10) => {
	let maxSize = size;

	/** @type {CommandHistoryItem[]} */
	let items = [];

	return {
		get items() {
			return items;
		},
		get last() {
			return items.at(-1);
		},

		/**
		 *
		 * @param {CommandHistoryItem} item
		 * @returns {CommandHistory}
		 */
		add(item) {
			const i = items.slice().reverse();

			i.unshift(item);
			i.slice(0, maxSize);

			items = i.reverse();

			return this;
		}
	};
};
