import {
  BWPalette,
  CanvasCreator,
  FullRGBNImageCreationParams,
  PixelDimensions,
  RawOutput,
  SourceCanvases,
} from '../Types';
import { ChannelKey, channels } from '../constants/enums';
import { getRawMonochromeImageData } from '../monochrome';
import { RGBN_SHADES } from '../constants/base';
import { BlendMode, blendModeNewName } from '../constants/blendModes';
import { createCanvasElement } from '../functions/canvasHelpers';

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
  canvasCreator = createCanvasElement,
): RawOutput => {
  const {
    tiles,
    imageStartLine,
    palette,
    lockFrame,
    tilesPerLine,
    handleExportFrame,
    scaleFactor,
  } = params;

  // const imageContext: RGBNImageContext = {
  //   tilesPerLine,
  //   imageStartLine,
  //   handleExportFrame,
  //   palette,
  //   lockFrame,
  // };

  const canvases: SourceCanvases = Object.entries(tiles)
    .reduce((acc, [key, channelTiles]): SourceCanvases => {
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
