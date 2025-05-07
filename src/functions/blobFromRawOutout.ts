import { CanvasCreator, RawOutput } from '../Types';

export const blobFromRawOutput = async (
  {
    data,
    dimensions: { width, height },
  }: RawOutput,
  canvasCreator: CanvasCreator,
  type = 'image/png',
): Promise<Blob> => {
  const canvas = canvasCreator();
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = new ImageData(data, canvas.width, canvas.height);
  context?.putImageData(imageData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Could not generate Blob from canvas'));
        return;
      }

      try {
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    }, type, 1);
  });
};
