import { promises as fs } from 'fs';
import path from 'path';
import { createCanvas, createImageData } from 'canvas';
import { getCanvasImageData } from './ getCanvasImageData';

const OUT_DIR = path.join(process.cwd(), 'images');

export const writeImageFileFromImageData = async (
  filename: string,
  canvas: HTMLCanvasElement,
) => {
  const { data, width, height } = getCanvasImageData(canvas);
  await fs.mkdir(OUT_DIR, { recursive: true });
  const writeCanvas = createCanvas(width, height);
  const context = writeCanvas.getContext('2d');
  const imageData = createImageData(data, width, height);
  context.putImageData(imageData, 0, 0);
  await fs.writeFile(path.join(OUT_DIR, filename), writeCanvas.toBuffer());
};
