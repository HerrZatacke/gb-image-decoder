import { tileIndexIsPartOfFrame } from './tileIndexIsPartOfFrame';
import { BWPalette, MonochromeImageContext, IndexedTilePixels, RGBValue } from '../Types';

export const getRGBValue = ({
  pixels,
  index,
  tileIndex,
  imageContext: {
    imageStartLine,
    handleExportFrame,
    imagePalette,
    framePalette,
  },
}: {
  pixels: IndexedTilePixels,
  index: number,
  tileIndex: number,
  imageContext: MonochromeImageContext,
}): RGBValue => {
  const palette: BWPalette = tileIndexIsPartOfFrame(tileIndex, imageStartLine, handleExportFrame) ?
    framePalette :
    imagePalette;

  const value: number = palette[pixels[index]];

  return {
    // eslint-disable-next-line no-bitwise
    r: (value & 0xff0000) >> 16,
    // eslint-disable-next-line no-bitwise
    g: (value & 0x00ff00) >> 8,
    // eslint-disable-next-line no-bitwise
    b: (value & 0x0000ff),
  };
};
