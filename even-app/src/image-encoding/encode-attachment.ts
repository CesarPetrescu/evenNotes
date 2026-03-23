import type { NoteImage } from '../types';
import { DIAGRAM_IMAGE_WIDTH, DIAGRAM_IMAGE_HEIGHT } from '../constants';
import { createDiagramCanvas } from '../diagrams/canvas-utils';
import { canvasToGray4Bytes } from './gray4';
import { canvasToBmpBytes } from './bmp';

export function loadImageElement(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image decode failed'));
    image.src = dataUrl;
  });
}

export function drawAttachmentImage(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, height);

  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (width - drawWidth) / 2;
  const y = (height - drawHeight) / 2;

  context.imageSmoothingEnabled = true;
  context.drawImage(image, x, y, drawWidth, drawHeight);

  context.strokeStyle = 'rgba(183, 255, 214, 0.32)';
  context.lineWidth = 1.5;
  context.strokeRect(0.75, 0.75, width - 1.5, height - 1.5);
}

export async function createAttachmentImageEncodings(image: NoteImage) {
  const element = await loadImageElement(image.dataUrl);
  const canvas = createDiagramCanvas(DIAGRAM_IMAGE_WIDTH, DIAGRAM_IMAGE_HEIGHT);
  drawAttachmentImage(element, canvas);

  return [
    {
      label: 'gray4' as const,
      imageData: Array.from(canvasToGray4Bytes(canvas))
    },
    {
      label: 'bmp' as const,
      imageData: Array.from(canvasToBmpBytes(canvas))
    }
  ];
}
