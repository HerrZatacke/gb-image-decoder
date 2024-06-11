import { RGBNPalette } from '../Types';
import { BlendMode } from './blendModes';


export const BLACK = 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
export const WHITE = '00000000000000000000000000000000';

export const SKIP_LINE = 'skip';

export const TILE_PIXEL_WIDTH = 8;

export const TILE_PIXEL_HEIGHT = 8;

export const TILES_PER_LINE = 20;

export const BW_PALETTE: number[] = [0xffffff, 0xaaaaaa, 0x555555, 0x000000];

export const BLACK_LINE: string[] = [
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
  BLACK,
];

export const WHITE_LINE: string[] = [
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
  WHITE,
];

export const defaultPalette: RGBNPalette = {
  r: [0, 84, 172, 255],
  g: [0, 84, 172, 255],
  b: [0, 84, 172, 255],
  n: [0, 85, 170, 255],
  blend: BlendMode.MULTIPLY,
};
