import { RawOutput } from '../Types';

export const scaleRawImageData = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  scale: number,
): RawOutput => {
  const newWidth = width * scale;
  const newHeight = height * scale;
  const scaled = new Uint8ClampedArray(newWidth * newHeight * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcIndex = ((y * width) + x) * 4;
      const r = data[srcIndex];
      const g = data[srcIndex + 1];
      const b = data[srcIndex + 2];
      const a = data[srcIndex + 3];

      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const destX = (x * scale) + dx;
          const destY = (y * scale) + dy;
          const destIndex = ((destY * newWidth) + destX) * 4;
          scaled[destIndex] = r;
          scaled[destIndex + 1] = g;
          scaled[destIndex + 2] = b;
          scaled[destIndex + 3] = a;
        }
      }
    }
  }

  return {
    data: scaled,
    dimensions: {
      width: newWidth,
      height: newHeight,
    },
  };
};
