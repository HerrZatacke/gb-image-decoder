import { BlendMode } from './constants/blendModes';
import { ChannelKey } from './constants/enums';

export interface Channel<DecoderType> {
  key: ChannelKey,
  tiles?: string[],
  decoder: DecoderType,
  canvas: HTMLCanvasElement,
}

/*
  Each channel should contain 360 tiles for a 160x144 image
  Each channel is optional
  R,G,B channels are recommended.
  'blend' is used to mix R,G,B result with the N channel
 */
export type RGBNTiles = Partial<Record<ChannelKey, string[]>>;

export type Channels<DecoderType> = Record<ChannelKey, Channel<DecoderType>>;

export type SourceCanvases = Partial<Record<ChannelKey, HTMLCanvasElement>>;

export interface ChangedTile {
  index: number,
  newTile: string,
}

export interface ScaledCanvasSize {
  initialHeight: number,
  initialWidth: number,
  tilesPerLine: number,
}

/*
  Basic representation of a color value
 */
export interface RGBValue {
  r: number,
  g: number,
  b: number,
}

/*
  Should be an array with 4 enties
 */
export type BWPalette = number[];

/*
  Should be an array with 64 enties
 */
export type IndexedTilePixels = number[];

/*
  A palette representing the brightnes of each channel.
  'blend' is used to mix R,G,B result with the N channel
 */export interface RGBNPalette {
  r?: number[],
  g?: number[],
  b?: number[],
  n?: number[],
  blend?: BlendMode,
}

export interface DecoderOptions {
   tilesPerLine?: number,
}
