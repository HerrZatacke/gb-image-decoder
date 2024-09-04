import { ExportFrameMode } from '../constants/enums';

export const tileIndexIsPartOfFrame = (
  tileIndex: number,
  imageStartLine: number,
  handleExportFrame: ExportFrameMode = ExportFrameMode.FRAMEMODE_KEEP,
): boolean => {

  const checkIndex = tileIndex - (handleExportFrame === ExportFrameMode.FRAMEMODE_KEEP ? 0 : 20);

  if (checkIndex < imageStartLine * 20) {
    return true;
  }

  if (checkIndex >= (imageStartLine * 20) + 280) {
    return true;
  }

  switch (checkIndex % 20) {
    case 0:
    case 1:
    case 18:
    case 19:
      return true;
    default:
      return false;
  }
};
