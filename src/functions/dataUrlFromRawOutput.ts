import { UrlCache } from '../UrlCache';
import { CanvasCreator, RawOutput } from '../Types';
import { blobFromRawOutput } from './blobFromRawOutout';

export const dataUrlFromRawOutput = async (
  rawOutput: RawOutput,
  scaleFactor: number,
  hash: string,
  canvasCreator: CanvasCreator,
): Promise<string> => {
  const urlCache = new UrlCache();

  urlCache.setUrl(hash, new Promise((resolve) => {
    blobFromRawOutput(rawOutput, scaleFactor, canvasCreator)
      .then(((blob) => {
        resolve(URL.createObjectURL(blob));
      }));
  }));

  const url = await urlCache.getUrl(hash);

  if (!url) {
    throw new Error('error generating image');
  }

  return url;
};
