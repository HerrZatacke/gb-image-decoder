import { UrlCache } from '../UrlCache';
import { Creators, RawOutput } from '../Types';
import { createCanvasElement, createImageData } from './canvasHelpers';

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
  creators?: Creators,
): Promise<string> => {
  const canvasCreator = creators?.canvasCreator || createCanvasElement;
  const imageDataCreator = creators?.imageDataCreator || createImageData;
  const urlCache = new UrlCache();

  const canvas = canvasCreator();
  canvas.width = width * scaleFactor;
  canvas.height = height * scaleFactor;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = imageDataCreator(data, canvas.width, canvas.height);
  context?.putImageData(imageData, 0, 0);

  const dataUrl = await toObjectUrl(canvas);
  urlCache.setUrl(hash, dataUrl);
  return dataUrl;
};
