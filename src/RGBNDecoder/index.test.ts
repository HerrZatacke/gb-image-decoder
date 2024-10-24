/* eslint-disable max-len */
import { beforeEach, describe, expect, test } from 'vitest';
import { hash } from 'ohash';
import { BlendMode, DecoderOptions, ExportFrameMode, RGBNTiles } from '../index';
import { RGBNDecoder } from './index';
import tiles1x1 from '../../test/data/tiles/rgbn/1x1';
import tiles16x14 from '../../test/data/tiles/rgbn/16x14';
import tiles20x18 from '../../test/data/tiles/rgbn/20x18';
import tiles20x86 from '../../test/data/tiles/rgbn/20x86';
import { rgbMultiply } from '../../test/data/palettes';
import { TILES_PER_LINE } from '../constants/base';
import { writeImageFileFromImageData } from '../../test/helpers/writeImageFileFromImageData';
import { getCanvasImageData } from '../../test/helpers/ getCanvasImageData';


const TEST_SCALE_FACTOR = 2;

const tileSets: Record<string, RGBNTiles> = {
  '1x1': tiles1x1,
  '16x14': tiles16x14,
  '20x18': tiles20x18,
  '20x86': tiles20x86,
};

describe('RGBN Decoder', () => {
  let defaultDecoderOptions: DecoderOptions = {};
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    defaultDecoderOptions = {
      tilesPerLine: TILES_PER_LINE,
    };
  });

  describe.each([
    { tileKey: '1x1', tilesPerLine: 1 },
    { tileKey: '16x14', tilesPerLine: 16 },
    { tileKey: '20x18', tilesPerLine: 20 },
    { tileKey: '20x86', tilesPerLine: 20 },
  ])('using $tileKey raw data', async ({ tileKey, tilesPerLine }) => {
    const constructDecoderOptions = {
      ...defaultDecoderOptions,
      tilesPerLine,
    };

    test.each([
      { blendMode: BlendMode.NORMAL },
      { blendMode: BlendMode.NORMAL_S },
      { blendMode: BlendMode.LIGHTEN },
      { blendMode: BlendMode.SCREEN },
      { blendMode: BlendMode.DODGE },
      { blendMode: BlendMode.ADDITION },
      { blendMode: BlendMode.DARKEN },
      { blendMode: BlendMode.MULTIPLY },
      { blendMode: BlendMode.BURN },
      { blendMode: BlendMode.OVERLAY },
      { blendMode: BlendMode.SOFTLIGHT },
      { blendMode: BlendMode.HARDLIGHT },
      { blendMode: BlendMode.DIFFERENCE },
      { blendMode: BlendMode.EXCLUSION },
    ])('renders on to a given canvas with blendmode: $blendMode', async ({ blendMode }) => {
      const decoder = new RGBNDecoder(constructDecoderOptions);

      decoder.update({
        canvas,
        palette: {
          ...rgbMultiply,
          blend: blendMode,
        },
        tiles: tileSets[tileKey],
      });

      await writeImageFileFromImageData(`rgb_${tileKey}_default_${blendMode}.png`, canvas);

      expect(hash(getCanvasImageData(canvas).data)).toMatchSnapshot();
    });

    test.each([
      { frameMode: ExportFrameMode.FRAMEMODE_KEEP },
      { frameMode: ExportFrameMode.FRAMEMODE_CROP },
      { frameMode: ExportFrameMode.FRAMEMODE_SQUARE_BLACK },
      { frameMode: ExportFrameMode.FRAMEMODE_SQUARE_WHITE },
    ])('renders a scaled canvas with framemode: $frameMode', async ({ frameMode }) => {
      const decoder = new RGBNDecoder(constructDecoderOptions);

      decoder.update({
        canvas: null,
        palette: rgbMultiply,
        tiles: tileSets[tileKey],
      });

      const scaledCanvas = decoder.getScaledCanvas(TEST_SCALE_FACTOR, frameMode);

      await writeImageFileFromImageData(`rgb_${tileKey}_scaled-${frameMode}.png`, scaledCanvas);

      expect(hash(getCanvasImageData(scaledCanvas).data)).toMatchSnapshot();
    });
  });

});
