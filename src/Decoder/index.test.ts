/* eslint-disable max-len */
import { beforeEach, describe, expect, test } from 'vitest';
import { hash } from 'ohash';
import { Decoder } from '.';
import { DecoderOptions, DecoderUpdateParams, ExportFrameMode } from '../index';
import tiles1x1 from '../../test/data/tiles/monochrome/1x1';
import tiles16x14 from '../../test/data/tiles/monochrome/16x14';
import tiles20x18 from '../../test/data/tiles/monochrome/20x18';
import tiles20x86 from '../../test/data/tiles/monochrome/20x86';
import { bw, red } from '../../test/data/palettes';
import { TILES_PER_LINE } from '../constants/base';
import { writeImageFileFromImageData } from '../../test/helpers/writeImageFileFromImageData';
import { getCanvasImageData } from '../../test/helpers/ getCanvasImageData';

const TEST_SCALE_FACTOR = 2;

const tileSets: Record<string, string[]> = {
  '1x1': tiles1x1,
  '16x14': tiles16x14,
  '20x18': tiles20x18,
  '20x86': tiles20x86,
};

describe('Monochrome Decoder', () => {
  let defaultDecoderOptions: DecoderOptions = {};
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    defaultDecoderOptions = {
      tilesPerLine: TILES_PER_LINE,
    };
  });

  describe.each([
    { tileKey: '1x1', tilesPerLine: 1, imageStartLine: 0 },
    { tileKey: '16x14', tilesPerLine: 16, imageStartLine: 2 },
    { tileKey: '20x18', tilesPerLine: 20, imageStartLine: 2 },
    { tileKey: '20x86', tilesPerLine: 20, imageStartLine: 13 },
  ])('using $tileKey raw data', async ({ tileKey, tilesPerLine, imageStartLine }) => {
    const constructDecoderOptions = {
      ...defaultDecoderOptions,
      tilesPerLine,
    };

    const decoderUpdateParams: Omit<DecoderUpdateParams, 'canvas'> = {
      framePalette: red,
      palette: bw,
      tiles: tileSets[tileKey],
      imageStartLine,
    };

    test('renders on to a given canvas', async () => {
      const decoder = new Decoder(constructDecoderOptions);

      decoder.update({
        canvas,
        ...decoderUpdateParams,
      });

      await writeImageFileFromImageData(`mono_${tileKey}_default.png`, canvas);

      expect(hash(getCanvasImageData(canvas).data)).toMatchSnapshot();
    });

    test.each([
      { frameMode: ExportFrameMode.FRAMEMODE_KEEP },
      { frameMode: ExportFrameMode.FRAMEMODE_CROP },
      { frameMode: ExportFrameMode.FRAMEMODE_SQUARE_BLACK },
      { frameMode: ExportFrameMode.FRAMEMODE_SQUARE_WHITE },
    ])('renders a scaled canvas with framemode: $frameMode', async ({ frameMode }) => {
      const decoder = new Decoder(constructDecoderOptions);

      decoder.update({
        canvas: null,
        ...decoderUpdateParams,
      });

      const scaledCanvas = decoder.getScaledCanvas(TEST_SCALE_FACTOR, frameMode);

      await writeImageFileFromImageData(`mono_${tileKey}_scaled-${frameMode}.png`, scaledCanvas);
      expect(hash(getCanvasImageData(scaledCanvas).data)).toMatchSnapshot();
    });
  });

});
