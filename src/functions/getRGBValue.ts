import { ExportFrameMode } from '../constants/enums';
import { tileIndexIsPartOfFrame } from './tileIndexIsPartOfFrame';
import { BWPalette, IndexedTilePixels, RGBValue } from '../Types';

const calculateImageStartLine = (handleExportFrame: ExportFrameMode, imageStartLine: number): number => {
  switch (handleExportFrame) {
    case ExportFrameMode.FRAMEMODE_CROP:
      return 0;

    case ExportFrameMode.FRAMEMODE_SQUARE_WHITE:
    case ExportFrameMode.FRAMEMODE_SQUARE_BLACK:
      return 2;

    case ExportFrameMode.FRAMEMODE_KEEP:
    default:
      return imageStartLine;
  }
};

export const getRGBValue = ({
  pixels,
  index,
  tileIndex,
  imageStartLine,
  handleExportFrame,
  colorData,
  frameColorData,
}: {
  pixels: IndexedTilePixels,
  index: number,
  tileIndex: number,
  imageStartLine: number,
  handleExportFrame: ExportFrameMode,
  colorData: BWPalette,
  frameColorData: BWPalette,
}): RGBValue => {

  const calculatedImageStartLine = calculateImageStartLine(handleExportFrame, imageStartLine);

  const palette: BWPalette = tileIndexIsPartOfFrame(tileIndex, calculatedImageStartLine, handleExportFrame) ?
    frameColorData :
    colorData;

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
