import { describe, expect, test } from 'vitest';
import { hash } from 'ohash';
import { createCanvas } from 'canvas';
import { getRawRGBNImageData } from '.';
import { BlendMode, CanvasCreator, ExportFrameMode, FullRGBNImageCreationParams } from '..';
import tiles16x14 from '../../test/data/tiles/rgbn/16x14';
import tiles20x18 from '../../test/data/tiles/rgbn/20x18';
import { rgbnSoft, rgbnDefault } from '../../test/data/palettes';
import { writeImageFileFromImageData } from '../../test/helpers/writeImageFileFromImageData';

const canvasCreator: CanvasCreator = () => (createCanvas(0, 0) as unknown as HTMLCanvasElement);

describe('RGBN image generation', () => {
  describe('using 16x14 raw data', async () => {
    const fullParams: FullRGBNImageCreationParams = {
      palette: rgbnDefault,
      lockFrame: false,
      tiles: tiles16x14,
      imageStartLine: 0,
      tilesPerLine: 16,
      scaleFactor: 1,
      handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
    };

    const {
      data: rawData,
      dimensions,
    } = getRawRGBNImageData(fullParams, canvasCreator);

    test('generates expected dimensions', () => {
      expect(dimensions).toMatchSnapshot();
    });

    test('generates expected hash for raw image data', () => {
      expect(hash(rawData)).toMatchSnapshot();
    });

    test('writes image file without error', async () => {
      await writeImageFileFromImageData(
        'rgbn_16x14.png',
        rawData,
        dimensions,
      );
    });
  });

  describe.each([
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
  ])('with blendmode: $blendMode', async ({ blendMode }) => {

    describe.each([{ lockFrame: true }, { lockFrame: false }])('with lockFrame: $lockFrame', async ({ lockFrame }) => {

      const fullParams: FullRGBNImageCreationParams = {
        palette: {
          ...rgbnSoft,
          blend: blendMode,
        },
        lockFrame,
        tiles: tiles20x18,
        imageStartLine: 2,
        tilesPerLine: 20,
        scaleFactor: 1,
        handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
      };

      const {
        data: rawData,
        dimensions,
      } = getRawRGBNImageData(fullParams, canvasCreator);

      test('generates expected dimensions', () => {
        expect(dimensions).toMatchSnapshot();
      });

      test('generates expected hash for raw image data', () => {
        expect(hash(rawData)).toMatchSnapshot();
      });

      test('writes image file without error', async () => {
        await writeImageFileFromImageData(
          `rgbn_20x18_${blendMode}${lockFrame ? '_lockFrame' : ''}.png`,
          rawData,
          dimensions,
        );
      });
    });
  });
});
