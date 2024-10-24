import type { CanvasCreator, ImageDataCreator } from '../Types';

export const createCanvasElement: CanvasCreator = (): HTMLCanvasElement => {
  try {
    return document.createElement('canvas');
  } catch (error) {
    throw new Error('cannot create canvas element');
  }
};

export const createImageData: ImageDataCreator = (
  rawImageData: Uint8ClampedArray,
  width: number,
  height: number,
): ImageData => (
  new ImageData(rawImageData, width, height)
);
