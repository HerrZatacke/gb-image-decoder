export enum ChannelKey {
  R = 'r',
  G = 'g',
  B = 'b',
  N = 'n',
}

export enum ExportFrameMode {
  FRAMEMODE_KEEP = 'keep',
  FRAMEMODE_CROP = 'crop',
  FRAMEMODE_SQUARE_BLACK = 'square_black',
  FRAMEMODE_SQUARE_WHITE = 'square_white',
}

export enum Rotation {
  DEG_0 = 0,
  DEG_90 = 1,
  DEG_180 = 2,
  DEG_270 = 3,
}

export const channels = [ChannelKey.R, ChannelKey.G, ChannelKey.B, ChannelKey.N];
