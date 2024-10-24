export const getCanvasImageData = (canvas: HTMLCanvasElement): ImageData => {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('context missing');
  }

  return context.getImageData(0, 0, canvas.width, canvas.height);
};
