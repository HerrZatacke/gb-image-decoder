import { beforeAll, vi } from 'vitest';
import { ImageData } from 'canvas';

// @ts-ignore
globalThis.ImageData = ImageData;

beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => (
    'blob:fake:blob'
  ));
});
