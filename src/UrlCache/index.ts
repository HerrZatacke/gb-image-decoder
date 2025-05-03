export class UrlCache {
  static rendered: Record<string, string> = {};

  public async getUrl(hash: string): Promise<string | null> {
    return Promise.resolve(UrlCache.rendered[hash] || null);
  }

  public setUrl(hash: string, url: string): void {
    if (UrlCache.rendered[hash]) {
      console.warn('hash already exists!');
    }

    UrlCache.rendered[hash] = url;
  }
}
