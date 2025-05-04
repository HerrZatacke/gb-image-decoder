import { afterAll, beforeAll, vi } from 'vitest';
import { ImageData } from 'canvas';
import { hash } from 'ohash';

// @ts-ignore
globalThis.ImageData = ImageData;

const blobStore = new Map<string, Blob>();

beforeAll(() => {
  global.URL.createObjectURL = vi.fn((blob: Blob) => {
    const blobHash = hash(blob.arrayBuffer());
    const id = `blob:nodedata:${blobHash}`;
    blobStore.set(id, blob);
    return id;
  });

  global.URL.revokeObjectURL = vi.fn((url: string) => {
    blobStore.delete(url);
  });
});

afterAll(() => {
  // Restore original methods if needed
  vi.restoreAllMocks();
  blobStore.clear();
});
