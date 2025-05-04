import { hash as objectHash } from 'ohash';
import {
  BWPalette,
  CropResult,
  FullMonochromeImageCreationParams,
  MonochromeImageContext,
  MonochromeImageCreationParams,
  IndexedTilePixels,
  PixelDimensions,
  RawOutput,
} from '../Types';
import {
  BLACK_LINE,
  FRAME_WIDTH,
  SKIP_LINE,
  TILE_PIXEL_HEIGHT,
  TILE_PIXEL_WIDTH,
  TILES_PER_LINE,
  WHITE_LINE,
} from '../constants/base';
import { ExportFrameMode } from '../constants/enums';
import { decodeTile } from '../functions/decodeTile';
import { getRGBValue } from '../functions/getRGBValue';
import { tileIndexIsPartOfFrame } from '../functions/tileIndexIsPartOfFrame';
import { UrlCache } from '../UrlCache';
import { dataUrlFromRawOutput } from '../functions/dataUrlFromRawOutput';
import { createCanvasElement } from '../functions/canvasHelpers';

const padLines: Record<string, string[]> = {
  [ExportFrameMode.FRAMEMODE_SQUARE_BLACK]: BLACK_LINE,
  [ExportFrameMode.FRAMEMODE_SQUARE_WHITE]: WHITE_LINE,
};

const getPalettes = (
  imagePalette: BWPalette,
  framePalette: BWPalette,
  tilesPerLine: number,
): {
  imagePalette: BWPalette,
  framePalette: BWPalette,
} => {
  if (tilesPerLine !== TILES_PER_LINE) {
    return {
      imagePalette,
      framePalette: imagePalette,
    };
  }

  return {
    imagePalette,
    framePalette,
  };
};

// Calculates basic width+height from number of tiles and tiles per line
export const getDimensions = (tilesLength: number, tilesPerLine: number): PixelDimensions => ({
  width: TILE_PIXEL_WIDTH * tilesPerLine,
  height: TILE_PIXEL_HEIGHT * Math.ceil(tilesLength / tilesPerLine),
});

const getCroppedTiles = (
  tiles: string[],
  imageContext: MonochromeImageContext,
): CropResult<MonochromeImageContext> => ({
  tiles: tiles
    .reduce((acc: string[], tile: string, index: number) => (
      tileIndexIsPartOfFrame(index, imageContext.imageStartLine, ExportFrameMode.FRAMEMODE_KEEP) ?
        acc :
        [...acc, tile]
    ), []),
  dimensions: { width: 128, height: 112 },
  contextUpdates: { tilesPerLine: 16, imageStartLine: 0 },
});

// for wild frame image, this returns the part of the image
// which has the image data in the default position by cropping
// away part of the wild frame which does not fit into 160x144
const getPaddedSquare = (
  tiles: string[],
  padLine: string[],
  imageContext: MonochromeImageContext,
): CropResult<MonochromeImageContext> => {
  let wholeImageStartLine = imageContext.imageStartLine - FRAME_WIDTH - 1;

  const paddedTiles = [...tiles];
  const square20by20tiles = (TILES_PER_LINE ** 2);

  while (
    paddedTiles.length < square20by20tiles ||
    wholeImageStartLine < 0
  ) {
    paddedTiles.unshift(...padLine);
    paddedTiles.push(...padLine);
    wholeImageStartLine += 1;
  }

  const startIndex = wholeImageStartLine * TILES_PER_LINE;
  return {
    tiles: paddedTiles.slice(startIndex, startIndex + square20by20tiles),
    dimensions: { width: 160, height: 160 },
    contextUpdates: { tilesPerLine: 20, imageStartLine: 3 },
  };
};

// Returns the actual tiles to be rendered based on ExportFrameMode
const applyCrop = (tiles: string[], imageContext: MonochromeImageContext): CropResult<MonochromeImageContext> => {
  // For ExportFrameMode to have an effect, the base image needs to have 20 tiles horizontally
  const checkFrameMode = imageContext.tilesPerLine !== TILES_PER_LINE ?
    ExportFrameMode.FRAMEMODE_KEEP :
    imageContext.handleExportFrame;

  switch (checkFrameMode) {
    case ExportFrameMode.FRAMEMODE_KEEP: {
      return {
        tiles,
        dimensions: getDimensions(tiles.length, imageContext.tilesPerLine),
        contextUpdates: {},
      };
    }

    case ExportFrameMode.FRAMEMODE_CROP: {
      return getCroppedTiles(tiles, imageContext);
    }

    case ExportFrameMode.FRAMEMODE_SQUARE_BLACK:
    case ExportFrameMode.FRAMEMODE_SQUARE_WHITE: {
      const padLine = padLines[checkFrameMode];
      return getPaddedSquare(tiles, padLine, imageContext);
    }

    default:
      throw new Error(`unknown export mode ${imageContext.handleExportFrame}`);
  }
};

// This paints the tile with a specified offset and pixel width
const paintTile = (
  rawImageData: Uint8ClampedArray,
  pixels: IndexedTilePixels | null,
  index: number,
  imageContext: MonochromeImageContext,
) => {
  const tileXOffset = index % imageContext.tilesPerLine;
  const tileYOffset = Math.floor(index / imageContext.tilesPerLine);

  const pixelXOffset = TILE_PIXEL_WIDTH * tileXOffset;
  const pixelYOffset = TILE_PIXEL_HEIGHT * tileYOffset;

  // pixels along the tile's x axis
  for (let x = 0; x < TILE_PIXEL_WIDTH; x += 1) {
    for (let y = 0; y < TILE_PIXEL_HEIGHT; y += 1) {
      // pixels along the tile's y axis

      const rawIndex = (pixelXOffset + x + ((pixelYOffset + y) * imageContext.tilesPerLine * TILE_PIXEL_WIDTH)) * 4;

      if (pixels !== null) {
        const color = getRGBValue({
          pixels,
          index: (y * TILE_PIXEL_WIDTH) + x,
          tileIndex: index,
          imageContext,
        });

        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex] = color.r;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 1] = color.g;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 2] = color.b;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 3] = 255;
      } else { // Skipping tile -> setting it transparent
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex] = 0;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 1] = 0;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 2] = 0;
        // eslint-disable-next-line no-param-reassign
        rawImageData[rawIndex + 3] = 0;
      }
    }
  }
};

const renderTile = (
  rawImageData: Uint8ClampedArray,
  rawLine: string,
  index: number,
  imageContext: MonochromeImageContext,
) => {
  if (rawLine === SKIP_LINE) {
    paintTile(rawImageData, null, index, imageContext);
  } else {
    const tile = decodeTile(rawLine);
    paintTile(rawImageData, tile, index, imageContext);
  }
};

const getFullParams = (params: MonochromeImageCreationParams): FullMonochromeImageCreationParams => ({
  tiles: params.tiles,
  imagePalette: params.imagePalette,
  framePalette: params.framePalette || params.imagePalette,
  imageStartLine: typeof params.imageStartLine === 'number' ? params.imageStartLine : FRAME_WIDTH,
  tilesPerLine: params.tilesPerLine || TILES_PER_LINE,
  scaleFactor: params.scaleFactor || 1,
  handleExportFrame: params.handleExportFrame || ExportFrameMode.FRAMEMODE_KEEP,
});

export const scaleRawImageData = (data: Uint8ClampedArray, width: number, height: number, scale: number): RawOutput => {
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

export const getRawMonochromeImageData = (params: FullMonochromeImageCreationParams): RawOutput => {
  const {
    tiles,
    imageStartLine,
    imagePalette,
    framePalette,
    tilesPerLine,
    handleExportFrame,
    scaleFactor,
  } = params;

  const imageContext: MonochromeImageContext = {
    tilesPerLine,
    imageStartLine,
    handleExportFrame,
    ...getPalettes(imagePalette, framePalette, tilesPerLine || TILES_PER_LINE),
  };

  const {
    tiles: usedTiles,
    dimensions: {
      width,
      height,
    },
    contextUpdates,
  } = applyCrop(tiles, imageContext);

  const updatedContext = {
    ...imageContext,
    ...contextUpdates,
  };

  if (!height || !width) {
    throw new Error('Image has no dimensions');
  }

  const rawImageData = new Uint8ClampedArray(width * height * 4);

  usedTiles.forEach((newTile, index) => {
    renderTile(rawImageData, newTile, index, updatedContext);
  });

  return scaleRawImageData(rawImageData, width, height, scaleFactor);
};

export const getMonochromeImageUrl = async (
  params: MonochromeImageCreationParams,
  canvasCreator = createCanvasElement,
): Promise<string> => {
  const urlCache = new UrlCache();

  const fullParams = getFullParams(params);
  const hash = objectHash(fullParams);

  const cachedUrl = await urlCache.getUrl(hash);
  if (cachedUrl) {
    return cachedUrl;
  }

  const rawOutput = getRawMonochromeImageData(fullParams);

  return dataUrlFromRawOutput(rawOutput, fullParams.scaleFactor, hash, canvasCreator);
};
