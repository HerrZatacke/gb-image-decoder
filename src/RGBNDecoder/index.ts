import { Decoder } from '../Decoder';
import { BlendMode, blendModeNewName } from '../constants/blendModes';
import { ChannelKey, channels, ExportFrameMode } from '../constants/enums';
import { defaultPalette, TILE_PIXEL_HEIGHT, TILES_PER_LINE } from '../constants/base';
import { paletteTemplates } from '../functions/paletteTemplates';
import { RGBNPalette, Channel, Channels, RGBNTiles, SourceCanvases, DecoderOptions } from '../Types';

const createChannel = (key: ChannelKey, tilesPerLine: number): Channel<Decoder> => {
  const canvas = document.createElement('canvas');
  const decoder = new Decoder({ tilesPerLine });

  decoder.update({
    canvas,
    tiles: [],
    palette: [],
    lockFrame: false,
    invertPalette: false,
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

  constructor(options?: DecoderOptions) {
    this.canvas = null;
    this.palette = defaultPalette;
    this.lockFrame = false;
    this.tilesPerLine = options?.tilesPerLine || TILES_PER_LINE;

    this.channels = {
      r: createChannel(ChannelKey.R, this.tilesPerLine),
      g: createChannel(ChannelKey.G, this.tilesPerLine),
      b: createChannel(ChannelKey.B, this.tilesPerLine),
      n: createChannel(ChannelKey.N, this.tilesPerLine),
    };
  }

  public update({
    canvas = null,
    tiles = {},
    palette,
    lockFrame = false,
  }: {
    canvas: HTMLCanvasElement | null,
    tiles: RGBNTiles,
    palette: RGBNPalette
    lockFrame: boolean,
  }) {
    const canvasChanged = canvas ? this.setCanvas(canvas) : false;
    const paletteChanged = this.setPalette(palette);
    const lockFrameChanged = this.setLockFrame(lockFrame); // true/false

    const shouldUpdate = canvasChanged || paletteChanged || lockFrameChanged;

    const canvases: SourceCanvases = this.setTiles(tiles);

    const newHeight = this.getHeight();

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
        invertPalette: false,
        canvas: channel.canvas,
        tiles: channel.tiles,
        lockFrame: this.lockFrame,
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
    const canvas = document.createElement('canvas');


    const canvases: SourceCanvases = channels.reduce((acc: SourceCanvases, key: ChannelKey): SourceCanvases => {
      const channel = this.channels[key];
      const channelCanvas = channel.decoder.getScaledCanvas(scaleFactor, handleExportFrame);

      return {
        ...acc,
        [key]: channelCanvas,
      };
    }, {});

    const { width, height } = Object.values(canvases).reduce((acc, current: HTMLCanvasElement) => ({
      width: Math.max(current.width, acc.width),
      height: Math.max(current.height, acc.height),
    }), { width: 0, height: 0 });

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('no canvas context');
    }

    this.blendCanvases(context, canvases);

    return canvas;
  }

  private maxTiles() {
    return channels.reduce((acc, key): number => {
      const channel = this.channels[key];
      return Math.max(acc, channel.tiles?.length || 0);
    }, 0);
  }

  private getHeight() {
    return TILE_PIXEL_HEIGHT * Math.ceil(this.maxTiles() / this.tilesPerLine);
  }
}

