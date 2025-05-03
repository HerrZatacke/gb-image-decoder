import { BW_PALETTE } from '../constants/base';
import { BWPalette } from '../Types';

export const parseStringPalette = (stringPalette: string[]): BWPalette => (
  stringPalette.map((color: string, index: number) => (
    color.length !== 7 ? BW_PALETTE[index] : parseInt(color.substring(1), 16)
  ))
);
