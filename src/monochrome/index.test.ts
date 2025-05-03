import { describe, expect, test } from 'vitest';
import { hash } from 'ohash';
import { getFullParams, getRawImageData } from '.';
import { MonochromeImageCreationParams, ExportFrameMode } from '../index';
import tiles1x1 from '../../test/data/tiles/monochrome/1x1';
import tiles16x14 from '../../test/data/tiles/monochrome/16x14';
import tiles20x18 from '../../test/data/tiles/monochrome/20x18';
import tiles20x18l1 from '../../test/data/tiles/monochrome/20x18_1';
import tiles20x86 from '../../test/data/tiles/monochrome/20x86';
import { bw, red } from '../../test/data/palettes';
import { writeImageFileFromImageData } from '../../test/helpers/writeImageFileFromImageData';

const tileSets: Record<string, string[]> = {
  '1x1': tiles1x1,
  '16x14': tiles16x14,
  '20x18': tiles20x18,
  '20x18_1': tiles20x18l1,
  '20x86': tiles20x86,
};

// const testScaleFactors = [1, 2];
const testScaleFactors = [2];
const testFrameModes: ExportFrameMode[] = [
  ExportFrameMode.FRAMEMODE_KEEP,
  ExportFrameMode.FRAMEMODE_CROP,
  ExportFrameMode.FRAMEMODE_SQUARE_BLACK,
  ExportFrameMode.FRAMEMODE_SQUARE_WHITE,
];

interface TestOption {
  tileKey: string,
  tilesPerLine: number,
  imageStartLine: number,
  scaleFactor: number,
  handleExportFrame: ExportFrameMode,
}

const options: TestOption[] = [
  { tileKey: '1x1', tilesPerLine: 1, imageStartLine: 0, scaleFactor: 1, handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP },
  { tileKey: '16x14', tilesPerLine: 16, imageStartLine: 2, scaleFactor: 1, handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP },
  { tileKey: '20x18_1', tilesPerLine: 20, imageStartLine: 1, scaleFactor: 1, handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP },
  { tileKey: '20x18', tilesPerLine: 20, imageStartLine: 2, scaleFactor: 1, handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP },
  { tileKey: '20x86', tilesPerLine: 20, imageStartLine: 13, scaleFactor: 1, handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP },
]
  .reduce((acc: TestOption[], option: TestOption): TestOption[] => ([
    ...acc,
    ...(
      testScaleFactors.map((scaleFactor) => ({
        ...option,
        scaleFactor,
      })).flat()
    ),
  ]), [])
  .reduce((acc: TestOption[], option: TestOption): TestOption[] => ([
    ...acc,
    ...(
      testFrameModes.map((handleExportFrame) => ({
        ...option,
        handleExportFrame,
      })).flat()
    ),
  ]), []);

describe('Monochrome image generation', () => {
  describe.each(options)('using $tileKey raw data scaled by $scaleFactor with frameMode $handleExportFrame', async ({ tileKey, tilesPerLine, imageStartLine, scaleFactor, handleExportFrame }) => {
    const decoderUpdateParams: MonochromeImageCreationParams = {
      framePalette: red,
      imagePalette: bw,
      tiles: tileSets[tileKey],
      imageStartLine,
      tilesPerLine,
      scaleFactor,
      handleExportFrame,
    };

    const fullParams = getFullParams(decoderUpdateParams);
    const {
      data: rawData,
      dimensions,
    } = getRawImageData(fullParams);


    test('generates expected hash for fullParams', () => {
      expect(hash(fullParams)).toMatchSnapshot();
    });

    test('generates expected dimensions', () => {
      expect(dimensions).toMatchSnapshot();
    });

    test('generates expected hash for raw image data', () => {
      expect(hash(rawData)).toMatchSnapshot();
    });

    test('writes image file without error', async () => {
      await writeImageFileFromImageData(
        `mono_${tileKey}_${scaleFactor}x_${handleExportFrame}_default.png`,
        rawData,
        dimensions,
      );
    });
  });
});
