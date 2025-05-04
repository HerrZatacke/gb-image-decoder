import { UrlCache } from '../UrlCache';
import { CanvasCreator, RawOutput } from '../Types';

const toObjectUrl = async (canvas: HTMLCanvasElement): Promise<string> => (
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not generate Blob from canvas'));
        return;
      }

      try {
        resolve(URL.createObjectURL(blob));
      } catch (error) {
        reject(error);
      }
    });
  })
);

export const dataUrlFromRawOutput = async (
  {
    data,
    dimensions: { width, height },
  }: RawOutput,
  scaleFactor: number,
  hash: string,
  canvasCreator: CanvasCreator,
): Promise<string> => {
  const urlCache = new UrlCache();

  urlCache.setUrl(hash, new Promise((resolve) => {
    const canvas = canvasCreator();
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;
    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    const imageData = new ImageData(data, canvas.width, canvas.height);
    context?.putImageData(imageData, 0, 0);

    resolve(toObjectUrl(canvas));
  }));

  const url = await urlCache.getUrl(hash);

  if (!url) {
    throw new Error('error generating image');
  }

  return url;
};
