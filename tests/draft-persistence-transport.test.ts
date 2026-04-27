import { describe, expect, it, vi } from 'vitest';
import { createDraftPersistenceApiTransport } from '../src/useDraftPersistence.svelte.js';

describe('createDraftPersistenceApiTransport', () => {
	it('loads draft records through the injected fetch implementation', async () => {
		const fetchImpl = vi.fn(async () => ({
			ok: true,
			json: async () => ({
				draft: {
					frontmatter: { title: 'Hello' },
					content: 'draft body',
					version: 3,
					savedAt: '2026-04-22T00:00:00.000Z'
				}
			})
		}));
		const transport = createDraftPersistenceApiTransport(fetchImpl as never);

		const result = await transport.loadDraft({
			contentType: 'post',
			slug: 'hello-world',
			authorHandle: 'jess'
		});

		expect(fetchImpl).toHaveBeenCalledWith('/api/drafts?author=jess&type=post&slug=hello-world');
		expect(result).toEqual({
			frontmatter: { title: 'Hello' },
			content: 'draft body',
			version: 3,
			savedAt: '2026-04-22T00:00:00.000Z'
		});
	});

	it('saves and deletes drafts through the injected fetch implementation', async () => {
		const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
			if (url === '/api/drafts' && init?.method === 'POST') {
				return {
					ok: true,
					json: async () => ({ version: 2, savedAt: '2026-04-22T01:02:03.000Z' })
				};
			}

			return {
				ok: true,
				json: async () => ({})
			};
		});
		const transport = createDraftPersistenceApiTransport(fetchImpl as never);

		const saveResult = await transport.saveDraft(
			{
				contentType: 'event',
				slug: 'spring-gathering',
				authorHandle: 'jess'
			},
			{
				frontmatter: { title: 'Spring Gathering' },
				content: 'event body'
			}
		);
		await transport.deleteDraft({
			contentType: 'event',
			slug: 'spring-gathering',
			authorHandle: 'jess'
		});

		expect(fetchImpl).toHaveBeenNthCalledWith(
			1,
			'/api/drafts',
			expect.objectContaining({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			})
		);
		expect(fetchImpl).toHaveBeenNthCalledWith(
			2,
			'/api/drafts?author=jess&type=event&slug=spring-gathering',
			{ method: 'DELETE' }
		);
		expect(saveResult).toEqual({
			version: 2,
			savedAt: '2026-04-22T01:02:03.000Z'
		});
	});
});
