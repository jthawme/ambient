import { writable } from 'svelte/store';

/**
 * @typedef {object} ToastItem
 * @property {string} message
 * @property {number} [time]
 * @property {'track' | 'info' | 'error'} [type]
 */

/**
 * @typedef {ToastItem} ToastItemFull
 * @property {number} id
 */

/** @type {import("svelte/store").Writable<ToastItemFull[]>}} */
const toastItemsStore = writable([]);

let itemsLength = 0;

export const toastItems = {
	...toastItemsStore,

	/**
	 *
	 * @param {ToastItem} item
	 */
	addItem(item) {
		const id = itemsLength + 1;
		toastItemsStore.update((items) => [
			...items,
			{
				id,
				...item
			}
		]);
		itemsLength = id;

		return () => toastItems.removeItem(id);
	},

	/**
	 *
	 * @param {number} itemId
	 */
	removeItem(itemId) {
		toastItemsStore.update((items) => {
			const cacheItems = items.slice();

			cacheItems.splice(
				cacheItems.findIndex((item) => item.id === itemId),
				1
			);

			return cacheItems;
		});
	}
};
