


























import type { useEditorQueue } from './useEditorQueue.svelte.js';

interface DraftState {
	isDirty: boolean;
	isSaving: boolean;
	lastSaved: Date | null;
	hasConflict: boolean;
	serverVersion: number;
	localVersion: number;
}

export interface DraftData {
	frontmatter: Record<string, unknown>;
	content: string;
}

export interface DraftPersistenceTarget {
	contentType: string;
	slug: string;
	authorHandle: string;
}

export interface DraftPersistenceSaveInput extends DraftData {}

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
	saveDraft(
		target: DraftPersistenceTarget,
		input: DraftPersistenceSaveInput
	): Promise<DraftPersistenceSaveResult>;
	deleteDraft(target: DraftPersistenceTarget): Promise<void>;
}

export function createDraftPersistenceApiTransport(
	fetchImpl: typeof fetch = fetch
): DraftPersistenceTransport {
	return {
		async loadDraft(target) {
			const params = new URLSearchParams({
				author: target.authorHandle,
				type: target.contentType,
				slug: target.slug
			});
			const res = await fetchImpl(`/api/drafts?${params}`);

			if (!res.ok) {
				throw new Error(`Load failed: ${res.statusText}`);
			}

			const data = await res.json();
			if (!data.draft) return null;

			return {
				frontmatter: data.draft.frontmatter,
				content: data.draft.content,
				version: data.draft.version,
				savedAt: data.draft.savedAt
			};
		},

		async saveDraft(target, input) {
			const res = await fetchImpl('/api/drafts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contentType: target.contentType,
					slug: target.slug,
					authorHandle: target.authorHandle,
					frontmatter: input.frontmatter,
					content: input.content
				})
			});

			if (!res.ok) {
				throw new Error(`Save failed: ${res.statusText}`);
			}

			const data = await res.json();
			return {
				version: data.version,
				savedAt: data.savedAt
			};
		},

		async deleteDraft(target) {
			const params = new URLSearchParams({
				author: target.authorHandle,
				type: target.contentType,
				slug: target.slug
			});
			const res = await fetchImpl(`/api/drafts?${params}`, { method: 'DELETE' });

			if (!res.ok) {
				throw new Error(`Delete failed: ${res.statusText}`);
			}
		}
	};
}










export function useDraftPersistence(options: {
	contentType: string;
	slug: string;
	authorHandle: string;
	queue: ReturnType<typeof useEditorQueue>;
	transport?: DraftPersistenceTransport;
}) {
	const target: DraftPersistenceTarget = {
		contentType: options.contentType,
		slug: options.slug,
		authorHandle: options.authorHandle
	};
	const transport = options.transport ?? createDraftPersistenceApiTransport();

	let state = $state<DraftState>({
		isDirty: false,
		isSaving: false,
		lastSaved: null,
		hasConflict: false,
		serverVersion: 0,
		localVersion: 0
	});

	


	async function loadDraft(): Promise<DraftData | null> {
		try {
			const draft = await transport.loadDraft(target);

			if (draft) {
				state.serverVersion = draft.version;
				state.localVersion = draft.version;
				state.lastSaved = new Date(draft.savedAt);
				return {
					frontmatter: draft.frontmatter,
					content: draft.content
				};
			}
			return null;
		} catch (error) {
			console.error('[DraftPersistence] Load error:', error);
			return null;
		}
	}

	


	function saveDraft(frontmatter: Record<string, unknown>, content: string): void {
		state.isDirty = true;

		options.queue.enqueue({
			type: 'autosave',
			execute: async () => {
				state.isSaving = true;
				try {
					const data = await transport.saveDraft(target, { frontmatter, content });

					if (data.version > state.localVersion + 1) {
						state.hasConflict = true;
						console.warn('[DraftPersistence] Version conflict detected', {
							local: state.localVersion,
							server: data.version
						});
					}

					state.localVersion = data.version;
					state.serverVersion = data.version;
					state.isDirty = false;
					state.lastSaved = data.savedAt ? new Date(data.savedAt) : new Date();
				} catch (error) {
					console.error('[DraftPersistence] Save error:', error);
					throw error;
				} finally {
					state.isSaving = false;
				}
			},
			onSuccess: () => {
				console.log('[DraftPersistence] Draft saved successfully', {
					version: state.localVersion,
					slug: options.slug
				});
			},
			onError: (error) => {
				console.error('[DraftPersistence] Draft save failed', error);
			}
		});
	}

	


	async function deleteDraft(): Promise<void> {
		try {
			await transport.deleteDraft(target);

			state.isDirty = false;
			state.lastSaved = null;
			state.localVersion = 0;
			state.serverVersion = 0;
		} catch (error) {
			console.error('[DraftPersistence] Delete error:', error);
			throw error;
		}
	}

	function markClean(): void {
		state.isDirty = false;
	}

	function acceptServerVersion(): void {
		state.hasConflict = false;
		state.localVersion = state.serverVersion;
	}

	return {
		
		get isDirty() {
			return state.isDirty;
		},
		get isSaving() {
			return state.isSaving;
		},
		get lastSaved() {
			return state.lastSaved;
		},
		get hasConflict() {
			return state.hasConflict;
		},
		get localVersion() {
			return state.localVersion;
		},
		get serverVersion() {
			return state.serverVersion;
		},

		
		loadDraft,
		saveDraft,
		deleteDraft,
		markClean,
		acceptServerVersion
	};
}
