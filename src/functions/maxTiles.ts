import { RGBNTiles } from '../Types';
import { channels } from '../constants/enums';

export const maxTiles = (rgbnTiles: RGBNTiles): number => (
  Math.max(...channels.map((key) => (
    rgbnTiles[key]?.length || 0
  )))
);
