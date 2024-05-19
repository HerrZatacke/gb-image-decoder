import { BLACK, TILE_PIXEL_HEIGHT, TILE_PIXEL_WIDTH } from '../constants/base';
import { IndexedTilePixels } from '../Types';

export const decodeTile = (rawBytes: string = BLACK): IndexedTilePixels => {
  const bytes = rawBytes.replace(/[^0-9A-F]/ig, '')
    .padEnd(32, 'f');

  const byteArray = new Array(16);
  for (let i = 0; i < byteArray.length; i += 1) {
    byteArray[i] = parseInt(bytes.substr(i * 2, 2), 16);
  }

  const pixels = new Array(TILE_PIXEL_WIDTH * TILE_PIXEL_HEIGHT) as IndexedTilePixels;

  for (let y = 0; y < TILE_PIXEL_HEIGHT; y += 1) {
    for (let x = 0; x < TILE_PIXEL_WIDTH; x += 1) {
      // eslint-disable-next-line no-bitwise
      const hiBit = (byteArray[(y * 2) + 1] >> (7 - x)) & 1;
      // eslint-disable-next-line no-bitwise
      const loBit = (byteArray[y * 2] >> (7 - x)) & 1;
      // eslint-disable-next-line no-bitwise
      pixels[(y * TILE_PIXEL_WIDTH) + x] = (hiBit << 1) | loBit;
    }
  }

  return pixels;
};
