import {
  BWPalette,
  IndexedTilePixels,
  ChangedTile,
  ScaledCanvasSize,
  DecoderOptions,
  DecoderUpdateParams,
  CanvasCreator,
  ImageDataCreator,
} from '../Types';
import {
  BLACK_LINE,
  BW_PALETTE,
  DEFAULT_FULL_PIXEL_HEIGHT,
  DEFAULT_FULL_PIXEL_WIDTH, FRAME_SIZE,
  FRAME_TILES,
  SKIP_LINE,
  TILE_PIXEL_HEIGHT,
  TILE_PIXEL_WIDTH, TILES_PER_COLUMN,
  TILES_PER_LINE,
  WHITE_LINE,
} from '../constants/base';
import { ExportFrameMode } from '../constants/enums';
import { decodeTile } from '../functions/decodeTile';
import { getRGBValue } from '../functions/getRGBValue';
import { createCanvasElement, createImageData } from '../functions/canvasHelpers';
import { tileIndexIsPartOfFrame } from '../functions/tileIndexIsPartOfFrame';

export class Decoder {
  private canvas: HTMLCanvasElement | null;
  private tiles: string[];
  private colors: string[];
  private frameColors: string[];
  private rawImageData: Uint8ClampedArray | null;
  private lockFrame: boolean;
  private colorData: BWPalette;
  private frameColorData: BWPalette;
  private tilesPerLine: number;
  private imageStartLine: number;
  private canvasCreator: CanvasCreator;
  private imageDataCreator: ImageDataCreator;

  constructor(options?: DecoderOptions) {
    this.canvas = null;
    this.tiles = [];
    this.colors = [];
    this.frameColors = [];
    this.rawImageData = null;
    this.lockFrame = false;
    this.colorData = [...BW_PALETTE];
    this.frameColorData = [...BW_PALETTE];
    this.tilesPerLine = options?.tilesPerLine || TILES_PER_LINE;
    this.imageStartLine = 2;
    this.canvasCreator = options?.canvasCreator || createCanvasElement;
    this.imageDataCreator = options?.imageDataCreator || createImageData;
  }

  public update({
    canvas,
    tiles,
    palette,
    framePalette,
    imageStartLine = 2,
  }: DecoderUpdateParams) {
    const startLineChanged = this.setImageStartLine(imageStartLine);
    const canvasChanged = canvas ? this.setCanvas(canvas) : false;
    // ignore frame palette for images with non-standard width
    const usedFramePalette = this.tilesPerLine === TILES_PER_LINE ? framePalette : palette;
    const palettesChanged = this.setPalettes(palette, usedFramePalette);

    if (startLineChanged || canvasChanged || palettesChanged || !this.tiles.length) {
      this.tiles = [];
    }

    const tilesChanged: ChangedTile[] = this.setTiles(tiles); // returns actual list of tiles that have changed

    const newHeight = this.getHeight();
    const newWidth = this.getWidth();

    if (!this.canvas) {
      return;
    }

    if (newHeight === 0) {
      this.canvas.height = 0;
      return;
    }

    if (
      this.canvas.height !== newHeight ||
      this.canvas.width !== newWidth ||
      !this.rawImageData?.length
    ) {
      this.canvas.height = newHeight;
      this.canvas.width = newWidth;

      // copy existing image data and add the missing space for additional height
      const newRawImageData = new Uint8ClampedArray(newWidth * newHeight * 4);
      this.rawImageData?.forEach((value, index) => {
        newRawImageData[index] = value;
      });
      this.rawImageData = newRawImageData;
    }

    tilesChanged.forEach(({ index, newTile }) => {
      this.renderTile(index, newTile);
    });

    this.updateCanvas(newWidth, newHeight);
  }

  private setImageStartLine(imageStartLine: number): boolean {
    if (this.imageStartLine === imageStartLine) {
      return false;
    }

    this.imageStartLine = imageStartLine;
    return true;
  }

  private updateCanvas(newWidth: number, newHeight: number) {
    if (!this.canvas || !this.rawImageData?.length) {
      return;
    }

    const context = this.canvas.getContext('2d');
    const imageData = this.imageDataCreator(this.rawImageData, newWidth, newHeight);

    context?.putImageData(imageData, 0, 0);
  }

  public getScaledCanvas(
    scaleFactor: number,
    handleExportFrame: ExportFrameMode = ExportFrameMode.FRAMEMODE_KEEP,
  ): HTMLCanvasElement {

    let handleFrameMode = handleExportFrame;

    // crop and square modes are only available for regular "camera" images
    if (
      this.tilesPerLine !== TILES_PER_LINE &&
      handleFrameMode !== ExportFrameMode.FRAMEMODE_KEEP
    ) {
      // console.warn('irregular image size (not 160x144) - will fall back to FRAMEMODE_KEEP');
      handleFrameMode = ExportFrameMode.FRAMEMODE_KEEP;
    }

    const {
      initialHeight,
      initialWidth,
      tilesPerLine,
    } = this.getScaledCanvasSize(handleFrameMode);

    const canvas = this.canvasCreator();
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('no canvas context');
    }

    canvas.width = initialWidth * scaleFactor;
    canvas.height = initialHeight * scaleFactor;

    this.getExportTiles(handleFrameMode)
      .forEach((tile, index) => {
        this.paintTileScaled(decodeTile(tile), index, context, scaleFactor, tilesPerLine, handleFrameMode);
      });

    return canvas;
  }

  private getScaledCanvasSize(handleExportFrame: ExportFrameMode): ScaledCanvasSize {
    // 2 tiles top/left/bottom/right -> 4 tiles to each side
    const width = this.getWidth();
    const height = this.getHeight();

    switch (handleExportFrame) {
      case ExportFrameMode.FRAMEMODE_KEEP:
        return {
          initialHeight: height,
          initialWidth: width,
          tilesPerLine: this.tilesPerLine,
        };
      case ExportFrameMode.FRAMEMODE_CROP:
        return {
          initialHeight: DEFAULT_FULL_PIXEL_HEIGHT - (TILE_PIXEL_HEIGHT * FRAME_TILES),
          initialWidth: DEFAULT_FULL_PIXEL_WIDTH - (TILE_PIXEL_WIDTH * FRAME_TILES),
          tilesPerLine: TILES_PER_LINE - FRAME_TILES,
        };
      case ExportFrameMode.FRAMEMODE_SQUARE_BLACK:
      case ExportFrameMode.FRAMEMODE_SQUARE_WHITE:
        return {
          initialHeight: width,
          initialWidth: width,
          tilesPerLine: this.tilesPerLine,
        };
      default:
        throw new Error(`unknown export mode ${handleExportFrame}`);
    }
  }

  private getExportTiles(handleExportFrame: ExportFrameMode): string[] {
    if (!this.tiles) {
      throw new Error('no tiles to export');
    }

    switch (handleExportFrame) {
      case ExportFrameMode.FRAMEMODE_KEEP:
        return this.tiles;
      case ExportFrameMode.FRAMEMODE_CROP:
        return this.getCroppedTiles();
      case ExportFrameMode.FRAMEMODE_SQUARE_BLACK:
        return [
          ...BLACK_LINE,
          ...this.getDefaultImageRange(),
          ...BLACK_LINE,
        ];
      case ExportFrameMode.FRAMEMODE_SQUARE_WHITE:
        return [
          ...WHITE_LINE,
          ...this.getDefaultImageRange(),
          ...WHITE_LINE,
        ];
      default:
        throw new Error(`unknown export mode ${handleExportFrame}`);
    }
  }

  private getCroppedTiles(): string[] {
    return this.tiles
      .reduce((acc: string[], tile: string, index: number) => (
        tileIndexIsPartOfFrame(index, this.imageStartLine, ExportFrameMode.FRAMEMODE_KEEP) ?
          acc :
          [...acc, tile]
      ), []);
  }

  // for wild frame image, this returns the part of theimage
  // which has the image data in the default position by cropping
  // away part of the wild frame which does not fit into 160x144
  private getDefaultImageRange(): string[] {
    const wholeImageStartLine = this.imageStartLine - FRAME_SIZE;
    const startIndex = wholeImageStartLine * TILES_PER_LINE;
    return this.tiles.slice(startIndex, startIndex + (TILES_PER_LINE * TILES_PER_COLUMN));
  }

  private setCanvas(canvas: HTMLCanvasElement) {
    if (this.canvas === canvas) {
      return false;
    }

    this.canvas = canvas;
    return true;
  }

  private setPalettes(
    palette: string[],
    framePalette: string[],
  ): boolean {
    if (
      this.colors[0] === palette[0] &&
      this.colors[1] === palette[1] &&
      this.colors[2] === palette[2] &&
      this.colors[3] === palette[3] &&
      this.frameColors[0] === framePalette[0] &&
      this.frameColors[1] === framePalette[1] &&
      this.frameColors[2] === framePalette[2] &&
      this.frameColors[3] === framePalette[3]
    ) {
      return false;
    }

    this.colors = palette;
    this.frameColors = framePalette;

    this.colors.forEach((color: string, index: number) => {
      this.colorData[index] = (
        color.length !== 7 ? BW_PALETTE[index] : parseInt(color.substring(1), 16)
      );
    });

    this.frameColors.forEach((color: string, index: number) => {
      this.frameColorData[index] = (
        color.length !== 7 ? BW_PALETTE[index] : parseInt(color.substring(1), 16)
      );
    });

    return true;
  }

  private setTiles(tiles: string[]): ChangedTile[] {

    const changedTiles = tiles
      .reduce((acc: ChangedTile[], newTile: string, index: number) => {
        const changed = newTile !== this.tiles[index];

        if (!changed) {
          return acc;
        }

        return [
          ...acc,
          {
            index,
            newTile,
          },
        ];
      }, []);

    this.tiles = tiles;
    return changedTiles;
  }

  private renderTile(tileIndex: number, rawLine: string) {
    if (rawLine === SKIP_LINE) {
      this.paintTile(null, tileIndex);
    } else {
      const tile = decodeTile(rawLine);
      this.paintTile(tile, tileIndex);
    }
  }

  // This paints the tile with a specified offset and pixel width
  private paintTile(pixels: IndexedTilePixels | null, index: number) {
    if (!this.rawImageData) {
      return;
    }

    const tileXOffset = index % this.tilesPerLine;
    const tileYOffset = Math.floor(index / this.tilesPerLine);

    const pixelXOffset = TILE_PIXEL_WIDTH * tileXOffset;
    const pixelYOffset = TILE_PIXEL_HEIGHT * tileYOffset;

    // pixels along the tile's x axis
    for (let x = 0; x < TILE_PIXEL_WIDTH; x += 1) {
      for (let y = 0; y < TILE_PIXEL_HEIGHT; y += 1) {
        // pixels along the tile's y axis

        const rawIndex = (pixelXOffset + x + ((pixelYOffset + y) * this.tilesPerLine * TILE_PIXEL_WIDTH)) * 4;

        if (pixels !== null) {
          const color = getRGBValue({
            pixels,
            index: (y * TILE_PIXEL_WIDTH) + x,
            tileIndex: index,
            imageStartLine: this.imageStartLine,
            handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
            colorData: this.colorData,
            frameColorData: this.frameColorData,
          });

          this.rawImageData[rawIndex] = color.r;
          this.rawImageData[rawIndex + 1] = color.g;
          this.rawImageData[rawIndex + 2] = color.b;
          this.rawImageData[rawIndex + 3] = 255;
        } else {
          this.rawImageData[rawIndex] = 0;
          this.rawImageData[rawIndex + 1] = 0;
          this.rawImageData[rawIndex + 2] = 0;
          this.rawImageData[rawIndex + 3] = 0;
        }
      }
    }
  }

  private paintTileScaled(
    pixels: IndexedTilePixels,
    index: number,
    canvasContext: CanvasRenderingContext2D,
    pixelSize: number,
    tilesPerLine: number,
    handleExportFrame: ExportFrameMode,
  ) {
    const tileXOffset = index % tilesPerLine;
    const tileYOffset = Math.floor(index / tilesPerLine);

    const pixelXOffset = TILE_PIXEL_WIDTH * tileXOffset * pixelSize;
    const pixelYOffset = TILE_PIXEL_HEIGHT * tileYOffset * pixelSize;

    // pixels along the tile's x axis
    for (let x = 0; x < TILE_PIXEL_WIDTH; x += 1) {
      for (let y = 0; y < TILE_PIXEL_HEIGHT; y += 1) {
        // pixels along the tile's y-axis

        const color = getRGBValue({
          pixels,
          index: (y * TILE_PIXEL_WIDTH) + x,
          tileIndex: index,
          imageStartLine: this.imageStartLine,
          handleExportFrame,
          colorData: this.colorData,
          frameColorData: this.frameColorData,
        });


        // eslint-disable-next-line no-param-reassign
        canvasContext.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;

        // Pixel Position (Needed to add +1 to pixel width and height to fill in a gap)
        canvasContext.fillRect(
          pixelXOffset + (x * pixelSize),
          pixelYOffset + (y * pixelSize),
          pixelSize + 1,
          pixelSize + 1,
        );
      }
    }
  }

  private getHeight(): number {
    return TILE_PIXEL_HEIGHT * Math.ceil(this.tiles.length / this.tilesPerLine);
  }

  private getWidth(): number {
    return TILE_PIXEL_WIDTH * this.tilesPerLine;
  }
}
