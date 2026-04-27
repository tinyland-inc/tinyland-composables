import type { useEditorQueue } from './useEditorQueue.svelte.js';
export interface DraftData {
    frontmatter: Record<string, unknown>;
    content: string;
}
export interface DraftPersistenceTarget {
    contentType: string;
    slug: string;
    authorHandle: string;
}
export interface DraftPersistenceSaveInput extends DraftData {
}
export interface DraftPersistenceRecord extends DraftData {
    version: number;
    savedAt: string;
}
export interface DraftPersistenceSaveResult {
    version: number;
    savedAt?: string;
}
export interface DraftPersistenceTransport {
    loadDraft(target: DraftPersistenceTarget): Promise<DraftPersistenceRecord | null>;
    saveDraft(target: DraftPersistenceTarget, input: DraftPersistenceSaveInput): Promise<DraftPersistenceSaveResult>;
    deleteDraft(target: DraftPersistenceTarget): Promise<void>;
}
export declare function createDraftPersistenceApiTransport(fetchImpl?: typeof fetch): DraftPersistenceTransport;
export declare function useDraftPersistence(options: {
    contentType: string;
    slug: string;
    authorHandle: string;
    queue: ReturnType<typeof useEditorQueue>;
    transport?: DraftPersistenceTransport;
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
//# sourceMappingURL=useDraftPersistence.svelte.d.ts.map