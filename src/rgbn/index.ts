import { hash as objectHash } from 'ohash';
import {
  BWPalette,
  CanvasCreator,
  FullRGBNImageCreationParams,
  PixelDimensions,
  RawOutput,
  RGBNImageCreationParams,
  SourceCanvases,
} from '../Types';
import { ChannelKey, channels, ExportFrameMode, Rotation } from '../constants/enums';
import { getRawMonochromeImageData } from '../monochrome';
import { FRAME_WIDTH, RGBN_SHADES, TILES_PER_LINE } from '../constants/base';
import { BlendMode, blendModeNewName } from '../constants/blendModes';
import { UrlCache } from '../UrlCache';
import { dataUrlFromRawOutput } from '../functions/dataUrlFromRawOutput';
import { createCanvasElement } from '../functions/canvasHelpers';
import { blobFromRawOutput } from '../functions/blobFromRawOutout';

const getFullParams = (params: RGBNImageCreationParams): FullRGBNImageCreationParams => ({
  tiles: params.tiles,
  palette: params.palette,
  lockFrame: params.lockFrame || false,
  imageStartLine: typeof params.imageStartLine === 'number' ? params.imageStartLine : FRAME_WIDTH,
  tilesPerLine: params.tilesPerLine || TILES_PER_LINE,
  scaleFactor: params.scaleFactor || 1,
  rotation: params.rotation || Rotation.DEG_0,
  handleExportFrame: params.handleExportFrame || ExportFrameMode.FRAMEMODE_KEEP,
});

const singleChannelPalette = (palette: number[], channelKey: ChannelKey): BWPalette => {
  switch (channelKey) {
    case ChannelKey.R:
      // eslint-disable-next-line no-bitwise
      return palette.map((shade) => ((shade & 0xff) << 16)).reverse();
    case ChannelKey.G:
      // eslint-disable-next-line no-bitwise
      return palette.map((shade) => ((shade & 0xff) << 8)).reverse();
    case ChannelKey.B:
      // eslint-disable-next-line no-bitwise
      return palette.map((shade) => (shade & 0xff)).reverse();
    default:
      return palette
        .map((shade) => {
          // eslint-disable-next-line no-bitwise
          const base = (shade & 0xff);
          // eslint-disable-next-line no-bitwise
          return ((base << 16) + (base << 8) + base);
        })
        .reverse();
  }
};

const getDimensions = (canvases: SourceCanvases): PixelDimensions => (
  Object.values(canvases).reduce((acc, current: HTMLCanvasElement) => {
    if (current.width === 0 || current.height === 0) {
      return acc;
    }

    return {
      width: Math.max(current.width, acc.width),
      height: Math.max(current.height, acc.height),
    };
  }, { width: 0, height: 0 })
);

const blendCanvases = (
  sourceCanvases: SourceCanvases,
  blendMode: BlendMode,
  canvasCreator: CanvasCreator,
): RawOutput => {
  const dimensions = getDimensions(sourceCanvases);
  const targetCanvas = canvasCreator();
  targetCanvas.width = dimensions.width;
  targetCanvas.height = dimensions.height;
  const targetContext = targetCanvas.getContext('2d') as CanvasRenderingContext2D;


  channels.forEach((key) => {
    const sourceCanvas = sourceCanvases[key];
    if (sourceCanvas && sourceCanvas.width && sourceCanvas.height) {
      if (key === ChannelKey.N) {
        // Normal blendmode means: skip N-Layer
        if (blendMode === BlendMode.NORMAL) {
          return;
        }

        // eslint-disable-next-line no-param-reassign
        targetContext.globalCompositeOperation = blendModeNewName(blendMode);
      } else {
        // eslint-disable-next-line no-param-reassign
        targetContext.globalCompositeOperation = 'lighter';
      }

      targetContext.drawImage(sourceCanvas, 0, 0);
    }

  });


  const imageData = targetContext.getImageData(0, 0, dimensions.width, dimensions.height);
  return {
    data: imageData.data,
    dimensions: {
      width: imageData.width,
      height: imageData.height,
    },
  };
};

export const getRawRGBNImageData = (
  params: FullRGBNImageCreationParams,
  canvasCreator: CanvasCreator,
): RawOutput => {
  const {
    tiles,
    imageStartLine,
    palette,
    lockFrame,
    tilesPerLine,
    handleExportFrame,
    scaleFactor,
    rotation,
  } = params;

  const canvases: SourceCanvases = Object.entries(tiles)
    .reduce((acc, [key, channelTiles]): SourceCanvases => {
      if (!channelTiles?.length) {
        return acc;
      }

      const channelKey = key as ChannelKey;

      const channelShades = palette[channelKey] || RGBN_SHADES;
      const channelPalette: BWPalette = singleChannelPalette(channelShades, channelKey);
      const lockFramePalette: BWPalette = lockFrame ? singleChannelPalette(RGBN_SHADES, channelKey) : channelPalette;

      const {
        data,
        dimensions,
      } = getRawMonochromeImageData({
        imagePalette: channelPalette,
        framePalette: lockFramePalette,
        handleExportFrame,
        imageStartLine,
        scaleFactor,
        rotation,
        tiles: channelTiles,
        tilesPerLine,
      });

      const canvas = canvasCreator();
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d') as CanvasRenderingContext2D;
      const imageData = new ImageData(data, dimensions.width, dimensions.height);
      context.putImageData(imageData, 0, 0);

      return {
        ...acc,
        [channelKey]: canvas,
      };
    }, {});

  return blendCanvases(canvases, palette.blend || BlendMode.NORMAL, canvasCreator);
};

export const getRGBNImageUrl = async (
  params: RGBNImageCreationParams,
  canvasCreator = createCanvasElement,
): Promise<string> => {
  const urlCache = new UrlCache();

  const fullParams = getFullParams(params);
  const hash = objectHash(fullParams);

  const cachedUrl = await urlCache.getUrl(hash);
  if (cachedUrl) {
    return cachedUrl;
  }

  const rawOutput = getRawRGBNImageData(fullParams, canvasCreator);

  return dataUrlFromRawOutput(rawOutput, fullParams.scaleFactor, hash, canvasCreator);
};


export const getRGBNImageBlob = async (
  params: RGBNImageCreationParams,
  fileType: string,
  canvasCreator = createCanvasElement,
): Promise<Blob> => {
  const fullParams = getFullParams(params);
  const rawOutput = getRawRGBNImageData(fullParams, canvasCreator);

  return blobFromRawOutput(rawOutput, fullParams.scaleFactor, canvasCreator, fileType);
};
