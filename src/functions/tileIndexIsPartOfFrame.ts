import { ExportFrameMode } from '../constants/enums';

export const tileIndexIsPartOfFrame = (
  tileIndex: number,
  imageStartLine: number,
  handleExportFrame: ExportFrameMode,
): boolean => {

  // when cropping the frame, no tile is "part of the frame"
  if (handleExportFrame === ExportFrameMode.FRAMEMODE_CROP) {
    return false;
  }

  if (tileIndex < imageStartLine * 20) {
    return true;
  }

  if (tileIndex >= (imageStartLine * 20) + 280) {
    return true;
  }

  switch (tileIndex % 20) {
    case 0:
    case 1:
    case 18:
    case 19:
      return true;
    default:
      return false;
  }
};
