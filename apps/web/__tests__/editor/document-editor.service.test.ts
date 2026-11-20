import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { loadEditablePage, saveEditablePage } from '@/lib/services/document-editor.service';
import { DEFAULT_BREAKPOINTS, DEFAULT_TOKEN_SET, CURRENT_SCHEMA_VERSION, type VersionedDocument } from '@/lib/document-model';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

function mockFetchOnce(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('loadEditablePage', () => {
  it('migrates legacy { sections: [...] } content into a VersionedDocument', async () => {
    mockFetchOnce(200, {
      data: { id: 'page-1', website_id: 'site-1', business_id: 'biz-1', title: 'Home', content: { sections: [{ type: 'heading', text: 'Hi', level: 1 }] } },
    });
    const page = await loadEditablePage('page-1');
    expect(page.id).toBe('page-1');
    expect(page.title).toBe('Home');
    expect(page.document.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(page.document.document.root.children).toHaveLength(1);
  });

  it('passes an already-migrated VersionedDocument through unchanged', async () => {
    const existing: VersionedDocument = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      document: {
        root: { id: 'root', kind: 'root', children: [] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {},
        assets: {},
      },
    };
    mockFetchOnce(200, { data: { id: 'page-1', website_id: 'site-1', business_id: 'biz-1', title: 'Home', content: existing } });
    const page = await loadEditablePage('page-1');
    expect(page.document).toEqual(existing);
  });

  it('throws with the server-provided message on a failed load', async () => {
    mockFetchOnce(404, { error: 'Page not found' });
    await expect(loadEditablePage('missing')).rejects.toThrow('Page not found');
  });
});

describe('saveEditablePage', () => {
  function validDocument(): VersionedDocument {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      document: {
        root: { id: 'root', kind: 'root', children: [{ id: 'h1', kind: 'heading', text: 'Hi', level: 1 }] },
        tokenSetId: DEFAULT_TOKEN_SET.id,
        breakpoints: DEFAULT_BREAKPOINTS,
        components: {},
        assets: {},
      },
    };
  }

  it('PUTs the document as content and resolves on success', async () => {
    mockFetchOnce(200, { data: { id: 'page-1' } });
    await expect(saveEditablePage('page-1', validDocument())).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/builder/pages/page-1',
      expect.objectContaining({ method: 'PUT' })
    );
    const call = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.content.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('refuses to save an invalid document WITHOUT ever calling fetch', async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;
    const invalid = validDocument();
    (invalid.document.root.children[0] as { level: unknown }).level = 99; // out of the 1-6 range
    await expect(saveEditablePage('page-1', invalid)).rejects.toThrow('Cannot save an invalid document');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('throws with the server-provided message on a failed save', async () => {
    mockFetchOnce(500, { error: 'Failed to update page' });
    await expect(saveEditablePage('page-1', validDocument())).rejects.toThrow('Failed to update page');
  });
});
