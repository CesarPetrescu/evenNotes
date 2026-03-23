export function drawBezierDiagram(context: CanvasRenderingContext2D, width: number, height: number) {
  const start = { x: width * 0.08, y: height * 0.74 };
  const controlA = { x: width * 0.28, y: height * 0.12 };
  const controlB = { x: width * 0.56, y: height * 0.14 };
  const end = { x: width * 0.92, y: height * 0.72 };

  context.strokeStyle = 'rgba(183, 255, 214, 0.46)';
  context.lineWidth = Math.max(1.5, width * 0.01);
  context.setLineDash([8, 8]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(controlA.x, controlA.y);
  context.lineTo(controlB.x, controlB.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.setLineDash([]);
  context.strokeStyle = '#b7ffd6';
  context.lineWidth = Math.max(2.5, width * 0.02);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.bezierCurveTo(controlA.x, controlA.y, controlB.x, controlB.y, end.x, end.y);
  context.stroke();

  const points = [start, controlA, controlB, end];
  context.fillStyle = '#b7ffd6';
  for (const point of points) {
    context.beginPath();
    context.arc(point.x, point.y, width * 0.022, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = 'rgba(183, 255, 214, 0.12)';
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.quadraticCurveTo(controlA.x, controlA.y, width * 0.5, height * 0.52);
  context.quadraticCurveTo(controlB.x, controlB.y, end.x, end.y);
  context.stroke();

  context.fillStyle = '#b7ffd6';
  context.font = `${Math.max(9, width * 0.05)}px "IBM Plex Mono", monospace`;
  context.fillText('Quadratic + cubic control flow', width * 0.08, height * 0.93);
}
