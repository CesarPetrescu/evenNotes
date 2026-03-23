import type { DiagramKind } from '../types';
import { DIAGRAM_IMAGE_WIDTH, DIAGRAM_IMAGE_HEIGHT } from '../constants';
import { createDiagramCanvas } from '../diagrams/canvas-utils';
import { drawDiagram } from '../diagrams/draw-diagram';
import { canvasToGray4Bytes } from './gray4';
import { canvasToBmpBytes } from './bmp';

export function createDiagramImageEncodings(kind: DiagramKind) {
  const canvas = createDiagramCanvas(DIAGRAM_IMAGE_WIDTH, DIAGRAM_IMAGE_HEIGHT);
  drawDiagram(kind, canvas);
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
