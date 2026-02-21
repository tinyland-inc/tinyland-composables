/**
 * Bulk Selection Composable
 * Manages selection state for bulk operations
 */
export declare function useBulkSelection<T extends {
    id: string;
} | {
    slug: string;
}>(getItemId?: (item: T) => string): {
    readonly selectedIds: Set<string>;
    readonly count: number;
    readonly hasSelection: boolean;
    select: (item: T) => void;
    deselect: (item: T) => void;
    toggle: (item: T) => void;
    selectAll: (items: T[]) => void;
    deselectAll: () => void;
    toggleAll: (items: T[]) => void;
    isSelected: (item: T) => boolean;
    getSelectedItems: (items: T[]) => T[];
    setSelection: (ids: Set<string>) => void;
};
//# sourceMappingURL=useBulkSelection.svelte.d.ts.map