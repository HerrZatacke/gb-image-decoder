import { CanvasCreator } from '../Types';

export const createCanvasElement: CanvasCreator = (): HTMLCanvasElement => {
  try {
    return document.createElement('canvas');
  } catch (error) {
    throw new Error('cannot create canvas element');
  }
};
