# GameBoy-Tile format Image Decoders

This package renders GameBoy-encoded images.  

You may use the [gbp-decode package](https://npmjs.com/gbp-decode) to decode various sources.  
Or you may want to use the [arduino-gameboy-printer-emulator](https://github.com/mofosyne/arduino-gameboy-printer-emulator).  
There are a lot more similar projects for aquiring raw tile data.  

## Usage

### Browser
#### Monochrome images
```typescript
import { getMonochromeImageUrl, ExportFrameMode } from 'gb-image-decoder';

const tiles: string[] = [ // need 360 of these for a 160x144 image
  '7D FF 0A FF 7D FF FF FF 5F FF BB FF 5D FF FF FF', '75 FF A2 FF 44 FF FF FF 5D FF FF FF FF FF FF FF', '55 FF 1F FF 57 FF FF FF 7D FF FF FF FF FF FF FF', '77 FF FD FF 57 FF FF FF 75 FF FF FF DF FF FF FF',
];
const monoPalette = ['#ffffff', '#aaaaaa', '#555555', '#000000'];

const imageSrc = await getMonochromeImageUrl({
  imagePalette: monoPalette,
  tiles,
  
  // Optional parameters (with it's defaults):
  // framePalette: monoPalette,
  // imageStartLine: 2,
  // tilesPerLine: 20,
  // scaleFactor: 1,
  // handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
})
```

#### RGB(N) images
`getRGBNImageUrl` provides a convenience function to combine separate monochrome tile sets into one colored image.  
the `RGBNTiles` type contains the four possible channels (`r`, `g`, `b`, `n`)  
The optional neutral layer will be overlayed on the previously combined rgb image.
```typescript
import { getRGBNImageUrl, ExportFrameMode, RGBNTiles, RGBNPalette, defaultPalette } from 'gb-image-decoder';

const tiles: RGBNTiles = {
  r: ['7D FF 0A FF 7D FF FF FF 5F FF BB FF 5D FF FF FF', '75 FF A2 FF 44 FF FF FF 5D FF FF FF FF FF FF FF', '55 FF 1F FF 57 FF FF FF 7D FF FF FF FF FF FF FF', '77 FF FD FF 57 FF FF FF 75 FF FF FF DF FF FF FF'],
  g: ['7F FF BF FF FF FF FF FF DF FF FF FF FF FF FF FF', 'A2 D5 FC C3 4C D3 FE C1 D8 E4 ED F2 FF F1 DB FC', 'EA 55 83 FC 48 F5 07 F8 A4 53 A8 07 A3 5C FE 01', 'FF 3F FF 3F FF 3F 7F BF FF 3F FF 7F 7D FF FF FF'],
  b: ['F7 FF A3 FF FF FF FF FF FF FF FF FF FF FF FF FF', '0A F5 80 FF 40 FF F1 FE FB FD F0 FF 52 FD E1 FE', '88 77 40 BF 2A D5 18 EF 88 77 04 FB AA 55 17 E8', 'A0 5F 51 AE AA 55 54 AB AA 55 05 FA AA 55 67 98'],
  // neutral image is optional
};

const imageSrc = await getRGBNImageUrl({
  palette: defaultPalette,
  tiles,
  
  // Optional parameters (with it's defaults):
  // imageStartLine: 2,
  // tilesPerLine: 20,
  // scaleFactor: 1,
  // handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
})
```

### Nodejs
Within a node environment, `getMonochromeImageUrl` and `getRGBNImageUrl` cannot be called, as they rely on the use of  `URL.createObjectURL(blob)`.

Instead the internally used functions need to be called. All parameters are mandatory. 
The resulting data and dimensions can be used to create an image e.g. by using the [canvas package](https://www.npmjs.com/package/canvas)

#### Monochrome images 
```typescript
import { getRawMonochromeImageData, FullMonochromeImageCreationParams, ExportFrameMode } from 'gb-image-decoder';

const monoPalette = ['#ffffff', '#aaaaaa', '#555555', '#000000'];

const fullParams: FullMonochromeImageCreationParams = {
  framePalette: monoPalette,
  imagePalette: monoPalette,
  tiles, // as in browser example
  imageStartLine: 2,
  tilesPerLine: 20,
  scaleFactor: 1,
  handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
};

const { data, dimensions } = getRawMonochromeImageData(fullParams);
```

#### RGB(N) images
```typescript
import { getRawRGBNImageData, FullRGBNImageCreationParams, defaultPalette, ExportFrameMode } from 'gb-image-decoder';

const monoPalette = ['#ffffff', '#aaaaaa', '#555555', '#000000'];

const fullParams: FullRGBNImageCreationParams = {
  palette: defaultPalette,
  tiles, // as in browser example
  imageStartLine: 2,
  tilesPerLine: 20,
  scaleFactor: 1,
  handleExportFrame: ExportFrameMode.FRAMEMODE_KEEP,
};

const { data, dimensions } = getRawRGBNImageData(fullParams);
```

## License: MIT
[LICENSE](./LICENSE)
