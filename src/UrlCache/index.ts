export class UrlCache {
  static rendered: Record<string, string> = {};
  static rendering: Record<string, Promise<string>> = {};

  public async getUrl(hash: string): Promise<string | null> {
    if (UrlCache.rendered.hasOwnProperty(hash)) {
      return UrlCache.rendered[hash];
    }

    if (UrlCache.rendering.hasOwnProperty(hash)) {
      const url = await UrlCache.rendering[hash];
      return url;
    }

    return null;
  }

  public async setUrl(hash: string, promise: Promise<string>): Promise<void> {
    if (
      UrlCache.rendered.hasOwnProperty(hash) ||
      UrlCache.rendering.hasOwnProperty(hash)
    ) {
      console.warn('hash already exists!');
    }

    UrlCache.rendering[hash] = promise;
    UrlCache.rendered[hash] = await promise;
    delete UrlCache.rendering[hash];
  }
}
