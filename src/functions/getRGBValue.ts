import { BW_PALETTE } from '../constants/base';
import { ExportFrameMode } from '../constants/enums';
import { tileIndexIsPartOfFrame } from './tileIndexIsPartOfFrame';
import { BWPalette, IndexedTilePixels, RGBValue } from '../Types';

export const getRGBValue = ({
  pixels,
  index,
  tileIndex,
  handleExportFrame,
  lockFrame,
  invertPalette,
  colorData,
}: {
  pixels: IndexedTilePixels,
  index: number,
  tileIndex: number,
  handleExportFrame: ExportFrameMode,
  lockFrame: boolean,
  invertPalette: boolean,
  colorData: BWPalette,
}): RGBValue => {
  const palette: BWPalette = (
    lockFrame && // Must be actually locked
    handleExportFrame !== ExportFrameMode.FRAMEMODE_CROP &&
    tileIndexIsPartOfFrame(tileIndex, handleExportFrame) // Current tile must be in a "lockable" position
  ) ? BW_PALETTE : colorData;
  const value: number = invertPalette ? palette[3 - pixels[index]] : palette[pixels[index]];

  return {
    // eslint-disable-next-line no-bitwise
    r: (value & 0xff0000) >> 16,
    // eslint-disable-next-line no-bitwise
    g: (value & 0x00ff00) >> 8,
    // eslint-disable-next-line no-bitwise
    b: (value & 0x0000ff),
  };
};
