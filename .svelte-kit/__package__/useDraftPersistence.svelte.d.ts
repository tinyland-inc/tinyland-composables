/**
 * Draft Persistence Composable
 *
 * Handles loading and saving drafts via persistent file storage.
 * Integrates with useEditorQueue for debounced, conflict-aware saving.
 *
 * @example
 * ```typescript
 * const queue = useEditorQueue();
 * const drafts = useDraftPersistence({
 *   contentType: 'blog',
 *   slug: 'my-post',
 *   authorHandle: 'jessie',
 *   queue
 * });
 *
 * // Load existing draft
 * const draft = await drafts.loadDraft();
 *
 * // Save changes (queued and debounced)
 * drafts.saveDraft({ title: 'New Title' }, 'Content here');
 *
 * // Delete draft after publish
 * await drafts.deleteDraft();
 * ```
 */
import type { useEditorQueue } from './useEditorQueue.svelte.js';
interface DraftData {
    frontmatter: Record<string, unknown>;
    content: string;
}
/**
 * Create a draft persistence manager
 *
 * @param options Configuration options
 * @param options.contentType Type of content (blog, event, product, etc.)
 * @param options.slug Content slug/identifier
 * @param options.authorHandle Author's handle
 * @param options.queue Editor operation queue for debouncing
 */
export declare function useDraftPersistence(options: {
    contentType: string;
    slug: string;
    authorHandle: string;
    queue: ReturnType<typeof useEditorQueue>;
}): {
    readonly isDirty: boolean;
    readonly isSaving: boolean;
    readonly lastSaved: Date | null;
    readonly hasConflict: boolean;
    readonly localVersion: number;
    readonly serverVersion: number;
    loadDraft: () => Promise<DraftData | null>;
    saveDraft: (frontmatter: Record<string, unknown>, content: string) => void;
    deleteDraft: () => Promise<void>;
    markClean: () => void;
    acceptServerVersion: () => void;
};
export {};
//# sourceMappingURL=useDraftPersistence.svelte.d.ts.map