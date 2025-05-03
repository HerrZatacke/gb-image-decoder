import fs, { promises as fsp } from 'fs';
import path from 'path';
import { createCanvas, createImageData } from 'canvas';
import { PixelDimensions } from '../../src/Types';

const OUT_DIR = path.join(process.cwd(), 'images');

export const writeImageFileFromImageData = async (
  filename: string,
  data: Uint8ClampedArray,
  { width, height }: PixelDimensions,
) => {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  const writeCanvas = createCanvas(width, height);
  const context = writeCanvas.getContext('2d');
  const imageData = createImageData(data, width, height);
  context.putImageData(imageData, 0, 0);

  const outputPath = path.join(OUT_DIR, filename);
  const out = fs.createWriteStream(outputPath);
  const stream = writeCanvas.createPNGStream();
  stream.pipe(out);

  return new Promise((resolve) => {
    out.on('finish', resolve);
  });
};
