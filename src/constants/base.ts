import { RGBNPalette } from '../Types';
import { BlendMode } from './blendModes';


export const BLACK = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
export const WHITE = '00000000000000000000000000000000';

export const SKIP_LINE = 'skip';

export const TILE_PIXEL_WIDTH = 8;

export const TILE_PIXEL_HEIGHT = 8;

export const TILES_PER_LINE = 20;

export const TILES_PER_COLUMN = 18;

export const FRAME_WIDTH = 2;

export const BW_PALETTE: number[] = [0xffffff, 0xaaaaaa, 0x555555, 0x000000];

export const BW_PALETTE_HEX: string[] = ['#ffffff', '#aaaaaa', '#555555', '#000000'];

export const BLACK_LINE: string[] = Array(TILES_PER_LINE).fill(BLACK);

export const WHITE_LINE: string[] = Array(TILES_PER_LINE).fill(WHITE);

export const RGBN_SHADES = [0, 0x55, 0xaa, 0xff];

export const defaultPalette: RGBNPalette = {
  r: RGBN_SHADES,
  g: RGBN_SHADES,
  b: RGBN_SHADES,
  n: RGBN_SHADES,
  blend: BlendMode.MULTIPLY,
};
