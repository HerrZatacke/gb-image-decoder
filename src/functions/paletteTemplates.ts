import { ChannelKey } from '../constants/enums';

const hx2 = (n?: number) => (n || 0).toString(16).padStart(2, '0');

export const paletteTemplates: Record<ChannelKey, ((n: number) => string)> = {
  r: (v?: number) => `#${hx2(v)}0000`,
  g: (v?: number) => `#00${hx2(v)}00`,
  b: (v?: number) => `#0000${hx2(v)}`,
  n: (v?: number) => `#${hx2(v)}${hx2(v)}${hx2(v)}`,
};
