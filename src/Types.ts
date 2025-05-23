import { BlendMode } from './constants/blendModes';
import { ChannelKey, ExportFrameMode, Rotation } from './constants/enums';

/*
  Each channel should contain 360 tiles for a 160x144 image
  Each channel is optional
  R,G,B channels are recommended.
  'blend' is used to mix R,G,B result with the N channel
 */
export type RGBNTiles = Partial<Record<ChannelKey, string[]>>;

export type SourceCanvases = Partial<Record<ChannelKey, HTMLCanvasElement>>;

export type CanvasCreator = () => HTMLCanvasElement;

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

export interface BaseImageCreationParams<TilesType> {
  tiles: TilesType,
  imageStartLine?: number,
  tilesPerLine?: number,
  scaleFactor?: number,
  rotation?: Rotation,
  handleExportFrame?: ExportFrameMode,
}

export interface MonochromeImageCreationParams extends BaseImageCreationParams<string[]>{
  imagePalette: BWPalette,
  framePalette?: BWPalette,
}

export type FullMonochromeImageCreationParams = Required<MonochromeImageCreationParams>;

export interface RGBNImageCreationParams extends BaseImageCreationParams<RGBNTiles>{
  palette: RGBNPalette,
  lockFrame?: boolean,
}

export type FullRGBNImageCreationParams = Required<RGBNImageCreationParams>;

export interface PixelDimensions {
  width: number,
  height: number,
}

export interface BaseImageContext {
  tilesPerLine: number,
  imageStartLine: number,
  handleExportFrame: ExportFrameMode,
  // Don't include width/height. These may change during image generation
}

export interface MonochromeImageContext extends BaseImageContext{
  imagePalette: BWPalette,
  framePalette: BWPalette,
}

export interface CropResult<ContextType> {
  tiles: string[],
  dimensions: PixelDimensions,
  contextUpdates: Partial<ContextType>
}

export interface RawOutput {
  data: Uint8ClampedArray,
  dimensions: PixelDimensions
}
