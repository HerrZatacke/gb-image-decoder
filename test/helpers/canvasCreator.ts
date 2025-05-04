import { createCanvas } from 'canvas';
import { CanvasCreator } from '../../src';

export const canvasCreator: CanvasCreator = () => {
  const cairoCanvas = createCanvas(0, 0);
  // @ts-ignore
  cairoCanvas.toBlob = (callback: (blob: Blob) => void) => {
    callback(new Blob([cairoCanvas.toBuffer()]));
  };

  return cairoCanvas as unknown as HTMLCanvasElement;
};
