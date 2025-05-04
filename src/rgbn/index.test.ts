import { describe, expect, test, vi } from 'vitest';
import { hash } from 'ohash';
import { getRawRGBNImageData } from '.';
import { BlendMode, CanvasCreator, ExportFrameMode, FullRGBNImageCreationParams, getRGBNImageUrl, RGBNTiles } from '..';
import tiles16x14b from '../../test/data/tiles/rgbn/16x14b';
import tiles16x14rgn from '../../test/data/tiles/rgbn/16x14rgn';
import tiles16x14rgb from '../../test/data/tiles/rgbn/16x14rgb';
import tiles16x14rgbn from '../../test/data/tiles/rgbn/16x14rgbn';
import tiles16x14rgbx from '../../test/data/tiles/rgbn/16x14rgbx';
import tiles16x14rn from '../../test/data/tiles/rgbn/16x14rn';
import tiles16x14xgb from '../../test/data/tiles/rgbn/16x14xgb';
import tiles20x18 from '../../test/data/tiles/rgbn/20x18';
import { rgbnDefault, rgbnSoft } from '../../test/data/palettes';
import { writeImageFileFromImageData } from '../../test/helpers/writeImageFileFromImageData';
import { canvasCreator } from '../../test/helpers/canvasCreator';

const tileSets: Record<string, RGBNTiles> = {
  '16x14b': tiles16x14b,
  '16x14rgn': tiles16x14rgn,
  '16x14rgb': tiles16x14rgb,
  '16x14rgbn': tiles16x14rgbn,
  '16x14rgbx': tiles16x14rgbx,
  '16x14rn': tiles16x14rn,
  '16x14xgb': tiles16x14xgb,
};

describe('RGBN image generation', () => {
  describe.each(Object.keys(tileSets))('using %s raw tile data', async (tileKey: string) => {
    const tiles = tileSets[tileKey];

    const fullParams: FullRGBNImageCreationParams = {
      palette: {
        ...rgbnDefault,
        blend: BlendMode.MULTIPLY,
      },
      lockFrame: false,
      tiles,
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
        `rgbn_${tileKey}.png`,
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

  test('getRGBNImageUrl', async () => {
    const toBlob = vi.fn((cb: (n: any) => void) => {
      cb({});
    });
    const putImageData = vi.fn(() => {});
    const drawImage = vi.fn(() => {});
    const getImageData = vi.fn(() => (new ImageData(new Uint8ClampedArray([0]), 1, 1)));

    const mockCanvasCreator = vi.fn(() => ({
      getContext: () => ({
        putImageData,
        drawImage,
        getImageData,
      }),
      toBlob,
    }));

    const generatedUrl = await getRGBNImageUrl({
      palette: rgbnDefault,
      tiles: tiles16x14rgb,
      tilesPerLine: 16,
      scaleFactor: 2,
    }, mockCanvasCreator as unknown as CanvasCreator);

    expect(generatedUrl).toBe('blob:fake:blob');
    expect(getImageData).toHaveBeenCalledTimes(1);
    expect(putImageData).toHaveBeenCalledTimes(4);
    expect(drawImage).toHaveBeenCalledTimes(3);
    expect(toBlob).toHaveBeenCalledTimes(1);
  });
});
