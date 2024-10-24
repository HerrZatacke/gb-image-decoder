import { Decoder } from '../Decoder';
import { BlendMode, blendModeNewName } from '../constants/blendModes';
import { ChannelKey, channels, ExportFrameMode } from '../constants/enums';
import { BW_PALETTE_HEX, defaultPalette, TILES_PER_LINE } from '../constants/base';
import { createCanvasElement, createImageData } from '../functions/canvasHelpers';
import { paletteTemplates } from '../functions/paletteTemplates';
import {
  RGBNPalette,
  Channel,
  Channels,
  RGBNTiles,
  SourceCanvases,
  DecoderOptions,
  RGBNDecoderUpdateParams,
  CanvasCreator,
  ImageDataCreator,
} from '../Types';

const createChannel = (
  key: ChannelKey,
  decoderOptions: Required<DecoderOptions>,
): Channel<Decoder> => {
  const canvas = decoderOptions.canvasCreator();
  const decoder = new Decoder(decoderOptions);

  decoder.update({
    framePalette: [],
    canvas,
    tiles: [],
    palette: [],
  });

  return {
    key,
    decoder,
    canvas,
  };
};

export class RGBNDecoder {
  private canvas: HTMLCanvasElement | null;
  private palette: RGBNPalette;
  private lockFrame: boolean;
  private channels: Channels<Decoder>;
  private tilesPerLine: number;
  private canvasCreator: CanvasCreator;
  private imageDataCreator: ImageDataCreator;

  constructor(options?: DecoderOptions) {
    this.canvas = null;
    this.palette = defaultPalette;
    this.lockFrame = false;
    this.tilesPerLine = options?.tilesPerLine || TILES_PER_LINE;
    this.canvasCreator = options?.canvasCreator || createCanvasElement;
    this.imageDataCreator = options?.imageDataCreator || createImageData;

    const channelDecoderOptions: Required<DecoderOptions> = {
      tilesPerLine: this.tilesPerLine,
      canvasCreator: this.canvasCreator,
      imageDataCreator: this.imageDataCreator,
    };

    this.channels = {
      r: createChannel(ChannelKey.R, channelDecoderOptions),
      g: createChannel(ChannelKey.G, channelDecoderOptions),
      b: createChannel(ChannelKey.B, channelDecoderOptions),
      n: createChannel(ChannelKey.N, channelDecoderOptions),
    };
  }

  public update({
    canvas,
    tiles,
    palette,
    lockFrame = false,
  }: RGBNDecoderUpdateParams) {
    const canvasChanged = canvas ? this.setCanvas(canvas) : false;
    const paletteChanged = this.setPalette(palette);
    const lockFrameChanged = this.setLockFrame(lockFrame); // true/false

    const shouldUpdate = canvasChanged || paletteChanged || lockFrameChanged;

    const canvases: SourceCanvases = this.setTiles(tiles);

    const { width: newWidth, height: newHeight } = this.getDimensions(canvases);

    if (!shouldUpdate) {
      return;
    }

    if (!this.canvas) {
      return;
    }

    if (newHeight === 0) {
      this.canvas.height = 0;
      return;
    }

    if (this.canvas.height !== newHeight) {
      this.canvas.height = newHeight;
    }

    if (this.canvas.width !== newWidth) {
      this.canvas.width = newWidth;
    }

    const context = this.canvas?.getContext('2d');
    if (!context) {
      return;
    }

    this.blendCanvases(context, canvases);
  }

  private setPalette(palette: RGBNPalette) {
    if (!palette) {
      return false;
    }

    if (JSON.stringify(this.palette) === JSON.stringify(palette)) {
      return false;
    }

    this.palette = palette;
    return true;
  }

  private setCanvas(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas) {
      return false;
    }

    this.canvas = canvas;
    return true;
  }

  private setLockFrame(lockFrame: boolean): boolean {
    if (lockFrame !== this.lockFrame) {
      this.lockFrame = lockFrame;
      return true;
    }

    return false;
  }

  private setTiles(tiles: RGBNTiles): SourceCanvases {
    return channels.reduce((acc, key): SourceCanvases => {
      const channel = this.channels[key];
      channel.tiles = tiles[key];
      const channelColors = this.palette[key];
      const paletteFunction = paletteTemplates[key];

      if (!channel.tiles || !channelColors) {
        return acc;
      }

      const palette = [
        paletteFunction(channelColors[3]),
        paletteFunction(channelColors[2]),
        paletteFunction(channelColors[1]),
        paletteFunction(channelColors[0]),
      ];

      channel.decoder.update({
        canvas: channel.canvas,
        tiles: channel.tiles,
        framePalette: this.lockFrame ? BW_PALETTE_HEX : palette,
        palette,
      });

      return {
        ...acc,
        [key]: channel.canvas,
      };
    }, {});
  }

  private blendCanvases(targetContext: CanvasRenderingContext2D, sourceCanvases: SourceCanvases) {
    channels.forEach((key) => {
      const sourceCanvas = sourceCanvases[key];
      if (sourceCanvas && sourceCanvas.width && sourceCanvas.height) {
        if (key === ChannelKey.N) {

          // Normal blendmode means: skip N-Layer
          if (this.palette.blend === BlendMode.NORMAL) {
            return;
          }

          // eslint-disable-next-line no-param-reassign
          targetContext.globalCompositeOperation = blendModeNewName(this.palette.blend);
        } else {
          // eslint-disable-next-line no-param-reassign
          targetContext.globalCompositeOperation = 'lighter';
        }

        targetContext.drawImage(sourceCanvas, 0, 0);
      }
    });
  }

  public getScaledCanvas(
    scaleFactor: number,
    handleExportFrame: ExportFrameMode = ExportFrameMode.FRAMEMODE_KEEP,
  ): HTMLCanvasElement {
    const canvas = this.canvasCreator();


    const canvases: SourceCanvases = channels.reduce((acc: SourceCanvases, key: ChannelKey): SourceCanvases => {
      const channel = this.channels[key];
      const channelCanvas = channel.decoder.getScaledCanvas(scaleFactor, handleExportFrame);

      return {
        ...acc,
        [key]: channelCanvas,
      };
    }, {});

    const { width, height } = this.getDimensions(canvases);

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('no canvas context');
    }

    context.fillStyle = '#000000';
    context.fillRect(0, 0, 500, 500);

    this.blendCanvases(context, canvases);

    return canvas;
  }

  private getDimensions(canvases: SourceCanvases): { width: number, height: number } {
    return Object.values(canvases).reduce((acc, current: HTMLCanvasElement) => {
      if (current.width === 0 || current.height === 0) {
        return acc;
      }

      return {
        width: Math.max(current.width, acc.width),
        height: Math.max(current.height, acc.height),
      };
    }, { width: 0, height: 0 });
  }
}

