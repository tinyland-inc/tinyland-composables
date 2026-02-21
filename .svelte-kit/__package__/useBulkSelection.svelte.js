/**
 * Bulk Selection Composable
 * Manages selection state for bulk operations
 */
export function useBulkSelection(getItemId = (item) => ('id' in item ? item.id : item.slug)) {
    let selectedIds = $state(new Set());
    const count = $derived(selectedIds.size);
    const hasSelection = $derived(selectedIds.size > 0);
    function select(item) {
        const id = getItemId(item);
        selectedIds = new Set([...selectedIds, id]);
    }
    function deselect(item) {
        const id = getItemId(item);
        const newSet = new Set(selectedIds);
        newSet.delete(id);
        selectedIds = newSet;
    }
    function toggle(item) {
        const id = getItemId(item);
        if (selectedIds.has(id)) {
            deselect(item);
        }
        else {
            select(item);
        }
    }
    function selectAll(items) {
        selectedIds = new Set(items.map(getItemId));
    }
    function deselectAll() {
        selectedIds = new Set();
    }
    function toggleAll(items) {
        if (selectedIds.size === items.length) {
            deselectAll();
        }
        else {
            selectAll(items);
        }
    }
    function isSelected(item) {
        return selectedIds.has(getItemId(item));
    }
    function getSelectedItems(items) {
        return items.filter((item) => selectedIds.has(getItemId(item)));
    }
    function setSelection(ids) {
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
