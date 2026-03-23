import type { DiagramKind } from '../types';
import { drawPythagorasDiagram } from './draw-pythagoras';
import { drawBezierDiagram } from './draw-bezier';

export function drawDiagram(kind: DiagramKind, canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { width, height } = canvas;
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#000000';
  context.fillRect(0, 0, width, height);
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (kind === 'pythagoras') {
    drawPythagorasDiagram(context, width, height);
    return;
  }

  drawBezierDiagram(context, width, height);
}
