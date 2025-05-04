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
    cache.setUrl('abc123', Promise.resolve('https://example.com'));
    const result = await cache.getUrl('abc123');
    expect(result).toBe('https://example.com');
  });

  it('should set and retrieve URL asynchronously', async () => {
    const hash = 'abc123';
    const cache = new UrlCache();

    const promise = new Promise<string>((resolveValue) => {
      new Promise((resolveDelay) => {
        global.setTimeout(resolveDelay, 10);
      }).then(() => {
        resolveValue('https://example.com/generated');
      });
    });

    // Start rendering
    cache.setUrl(hash, promise);

    // While it's still rendering, we should get the same Promise
    const inProgress = cache.getUrl(hash);
    expect(inProgress).toBeInstanceOf(Promise);
    expect(await inProgress).toBe('https://example.com/generated');

    // Now it should be in the cache as a final string
    const cached = await cache.getUrl(hash);
    expect(cached).toBe('https://example.com/generated');
  });

  it('should warn when overwriting an existing hash', () => {
    const cache = new UrlCache();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    cache.setUrl('abc123', Promise.resolve('https://example.com'));
    cache.setUrl('abc123', Promise.resolve('https://example2.com'));
    expect(warnSpy).toHaveBeenCalledWith('hash already exists!');
    warnSpy.mockRestore();
  });
});
