import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrlCache } from '..';

describe('UrlCache', () => {
  beforeEach(() => {
    UrlCache.rendered = {};
  });

  it('should return null for an unknown hash', async () => {
    const cache = new UrlCache();
    const result = await cache.getUrl('unknown');
    expect(result).toBeNull();
  });

  it('should store and retrieve a URL', async () => {
    const cache = new UrlCache();
    cache.setUrl('abc123', 'https://example.com');
    const result = await cache.getUrl('abc123');
    expect(result).toBe('https://example.com');
  });

  it('should warn when overwriting an existing hash', () => {
    const cache = new UrlCache();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cache.setUrl('abc123', 'https://example.com');
    cache.setUrl('abc123', 'https://example2.com');
    expect(warnSpy).toHaveBeenCalledWith('hash already exists!');
    warnSpy.mockRestore();
  });
});
