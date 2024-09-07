# GameBoy-Tile format Image Decoders

This package renders GameBoy-encoded images to a canvas element.  

You may need the [gbp-decode package](https://npmjs.com/gbp-decode) to decode various sources.  
Or you may want to use the [arduino-gameboy-printer-emulator](https://github.com/mofosyne/arduino-gameboy-printer-emulator).  
There are a lot more similar projects for aquiring raw tile data.  

## Usage
Import within your Project
```typescript
import { RGBNDecoder, Decoder, RGBNTiles } from 'gb-image-decoder';
```

Have a canvas element inside your DOM
```typescript
const myCanvas: HTMLCanvasElement = document.createElement('canvas');
```

### For monochrome images:

Have a set of tiles (each string represents a 8x8 tile)
```typescript
// For classic monochrome images:
const myTiles: string[] = [ // need 360 of these for a 160x144 image
  '7D FF 0A FF 7D FF FF FF 5F FF BB FF 5D FF FF FF', '75 FF A2 FF 44 FF FF FF 5D FF FF FF FF FF FF FF', '55 FF 1F FF 57 FF FF FF 7D FF FF FF FF FF FF FF', '77 FF FD FF 57 FF FF FF 75 FF FF FF DF FF FF FF',
];
```

Have a palette for your monochrome image
```typescript
const monoPalette = ['#ffffff', '#aaaaaa', '#555555', '#000000'];
```

Initialize the decoder:
```typescript
const decoder = new Decoder();
decoder.update({
  canvas: myCanvas,
  tiles: myTiles,
  palette: monoPalette,
  framePalette: monoPalette,
  lockFrame: false,
});
```

### For RGBN images:
RGB(N) Images can contain any of the channels. All channels are optional, but the r,g,b channels are recommended.  

Your image needs a set of RGBN tiles:
```typescript
// For RGBN images
const myTilesRGBN: RGBNTiles = { // need 360 of each for a 160x144 image
  r: ['7D FF 0A FF 7D FF FF FF 5F FF BB FF 5D FF FF FF', '75 FF A2 FF 44 FF FF FF 5D FF FF FF FF FF FF FF', '55 FF 1F FF 57 FF FF FF 7D FF FF FF FF FF FF FF', '77 FF FD FF 57 FF FF FF 75 FF FF FF DF FF FF FF'],
  g: ['7F FF BF FF FF FF FF FF DF FF FF FF FF FF FF FF', 'A2 D5 FC C3 4C D3 FE C1 D8 E4 ED F2 FF F1 DB FC', 'EA 55 83 FC 48 F5 07 F8 A4 53 A8 07 A3 5C FE 01', 'FF 3F FF 3F FF 3F 7F BF FF 3F FF 7F 7D FF FF FF'],
  b: ['F7 FF A3 FF FF FF FF FF FF FF FF FF FF FF FF FF', '0A F5 80 FF 40 FF F1 FE FB FD F0 FF 52 FD E1 FE', '88 77 40 BF 2A D5 18 EF 88 77 04 FB AA 55 17 E8', 'A0 5F 51 AE AA 55 54 AB AA 55 05 FA AA 55 67 98'],
  // neutral image is optional
};
```

For RGBN there is a default blend palette available:
```typescript
import { defaultPalette as rgbnPalette } from 'gb-image-decoder';
```

Initialize the decoder:
```typescript
const decoder = new RGBNDecoder();
decoder.update({
  canvas: myCanvas,
  tiles: myTilesRGBN,
  palette: rgbnPalette,
  lockFrame: false,
});
```

## ToDos
* improve docs
* tests

## License: MIT
[LICENSE](./LICENSE)
