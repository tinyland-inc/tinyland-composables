/**
 * Bulk Selection Composable
 * Manages selection state for bulk operations
 */

export function useBulkSelection<T extends { id: string } | { slug: string }>(
	getItemId: (item: T) => string = (item) => ('id' in item ? item.id : (item as any).slug)
) {
	let selectedIds = $state<Set<string>>(new Set());

	const count = $derived(selectedIds.size);
	const hasSelection = $derived(selectedIds.size > 0);

	function select(item: T) {
		const id = getItemId(item);
		selectedIds = new Set([...selectedIds, id]);
	}

	function deselect(item: T) {
		const id = getItemId(item);
		const newSet = new Set(selectedIds);
		newSet.delete(id);
		selectedIds = newSet;
	}

	function toggle(item: T) {
		const id = getItemId(item);
		if (selectedIds.has(id)) {
			deselect(item);
		} else {
			select(item);
		}
	}

	function selectAll(items: T[]) {
		selectedIds = new Set(items.map(getItemId));
	}

	function deselectAll() {
		selectedIds = new Set();
	}

	function toggleAll(items: T[]) {
		if (selectedIds.size === items.length) {
			deselectAll();
		} else {
			selectAll(items);
		}
	}

	function isSelected(item: T): boolean {
		return selectedIds.has(getItemId(item));
	}

	function getSelectedItems(items: T[]): T[] {
		return items.filter((item) => selectedIds.has(getItemId(item)));
	}

	function setSelection(ids: Set<string>) {
		selectedIds = ids;
	}

	return {
		// State
		get selectedIds() {
			return selectedIds;
		},
		get count() {
			return count;
		},
		get hasSelection() {
			return hasSelection;
		},

		// Actions
		select,
		deselect,
		toggle,
		selectAll,
		deselectAll,
		toggleAll,
		isSelected,
		getSelectedItems,
		setSelection
	};
}
