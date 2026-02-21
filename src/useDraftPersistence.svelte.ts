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

interface DraftState {
	isDirty: boolean;
	isSaving: boolean;
	lastSaved: Date | null;
	hasConflict: boolean;
	serverVersion: number;
	localVersion: number;
}

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
export function useDraftPersistence(options: {
	contentType: string;
	slug: string;
	authorHandle: string;
	queue: ReturnType<typeof useEditorQueue>;
}) {
	let state = $state<DraftState>({
		isDirty: false,
		isSaving: false,
		lastSaved: null,
		hasConflict: false,
		serverVersion: 0,
		localVersion: 0
	});

	/**
	 * Load existing draft from server
	 */
	async function loadDraft(): Promise<DraftData | null> {
		try {
			const params = new URLSearchParams({
				author: options.authorHandle,
				type: options.contentType,
				slug: options.slug
			});
			const res = await fetch(`/api/drafts?${params}`);

			if (!res.ok) {
				console.error('[DraftPersistence] Load failed:', res.statusText);
				return null;
			}

			const data = await res.json();

			if (data.draft) {
				state.serverVersion = data.draft.version;
				state.localVersion = data.draft.version;
				state.lastSaved = new Date(data.draft.savedAt);
				return {
					frontmatter: data.draft.frontmatter,
					content: data.draft.content
				};
			}
			return null;
		} catch (error) {
			console.error('[DraftPersistence] Load error:', error);
			return null;
		}
	}

	/**
	 * Save draft (queued and debounced via editor queue)
	 */
	function saveDraft(frontmatter: Record<string, unknown>, content: string): void {
		state.isDirty = true;

		options.queue.enqueue({
			type: 'autosave',
			execute: async () => {
				state.isSaving = true;
				try {
					const res = await fetch('/api/drafts', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							contentType: options.contentType,
							slug: options.slug,
							authorHandle: options.authorHandle,
							frontmatter,
							content
						})
					});

					if (!res.ok) {
						throw new Error(`Save failed: ${res.statusText}`);
					}

					const data = await res.json();

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
					state.lastSaved = new Date();
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

	/**
	 * Delete draft from server (e.g., after publish)
	 */
	async function deleteDraft(): Promise<void> {
		try {
			const params = new URLSearchParams({
				author: options.authorHandle,
				type: options.contentType,
				slug: options.slug
			});
			const res = await fetch(`/api/drafts?${params}`, { method: 'DELETE' });

			if (!res.ok) {
				throw new Error(`Delete failed: ${res.statusText}`);
			}

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
		// State (read-only)
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

		// Actions
		loadDraft,
		saveDraft,
		deleteDraft,
		markClean,
		acceptServerVersion
	};
}
