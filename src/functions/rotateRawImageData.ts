import { Rotation } from '../constants/enums';
import { RawOutput } from '../Types';

export const rotateImageData = (
  input: Uint8ClampedArray,
  width: number,
  height: number,
  rotation: Rotation,
): RawOutput => {

  if (rotation === Rotation.DEG_0) {
    return {
      data: input,
      dimensions: {
        width,
        height,
      },
    };
  }

  const channels = 4;
  const output = new Uint8ClampedArray(input.length);

  const getIndex = (x: number, y: number, w: number) => ((y * w) + x) * channels;

  let newWidth = width;
  let newHeight = height;

  switch (rotation) {
    case Rotation.DEG_90:
    case Rotation.DEG_270:
      newWidth = height;
      newHeight = width;
      break;
    case Rotation.DEG_180:
    default:
      break;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const srcIdx = getIndex(x, y, width);
      let dstX = x;
      let dstY = y;

      switch (rotation) {
        case Rotation.DEG_90:
          dstX = height - y - 1;
          dstY = x;
          break;
        case Rotation.DEG_180:
          dstX = width - x - 1;
          dstY = height - y - 1;
          break;
        case Rotation.DEG_270:
          dstX = y;
          dstY = width - x - 1;
          break;
        default:
          break;
      }

      const dstIdx = getIndex(dstX, dstY, newWidth);
      for (let i = 0; i < channels; i += 1) {
        output[dstIdx + i] = input[srcIdx + i];
      }
    }
  }

  return {
    data: output,
    dimensions: {
      width: newWidth,
      height: newHeight,
    },
  };
};
