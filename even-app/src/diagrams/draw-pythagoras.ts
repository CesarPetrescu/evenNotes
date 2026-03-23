export function drawPythagorasDiagram(context: CanvasRenderingContext2D, width: number, height: number) {
  const baseLeft = width * 0.14;
  const baseY = height * 0.84;
  const baseRight = width * 0.58;
  const topX = width * 0.58;
  const topY = height * 0.34;

  const shortSide = height * 0.24;
  const longSide = width * 0.22;
  const hypDx = topX - baseLeft;
  const hypDy = topY - baseY;
  const hypLength = Math.hypot(hypDx, hypDy);
  const normX = -hypDy / hypLength;
  const normY = hypDx / hypLength;
  const squareDepth = height * 0.13;

  context.strokeStyle = '#b7ffd6';
  context.lineWidth = Math.max(2, width * 0.012);

  context.beginPath();
  context.moveTo(baseLeft, baseY);
  context.lineTo(baseRight, baseY);
  context.lineTo(topX, topY);
  context.closePath();
  context.stroke();

  context.strokeRect(baseRight, baseY - shortSide, shortSide, shortSide);
  context.strokeRect(baseLeft, baseY, longSide, longSide);

  context.beginPath();
  context.moveTo(baseLeft, baseY);
  context.lineTo(baseLeft + normX * squareDepth, baseY + normY * squareDepth);
  context.lineTo(topX + normX * squareDepth, topY + normY * squareDepth);
  context.lineTo(topX, topY);
  context.stroke();

  context.beginPath();
  context.moveTo(baseLeft + normX * squareDepth, baseY + normY * squareDepth);
  context.lineTo(baseLeft + normX * squareDepth + hypDx, baseY + normY * squareDepth + hypDy);
  context.stroke();

  context.fillStyle = 'rgba(183, 255, 214, 0.12)';
  context.fillRect(baseRight, baseY - shortSide, shortSide, shortSide);
  context.fillRect(baseLeft, baseY, longSide, longSide);

  context.beginPath();
  context.moveTo(baseLeft, baseY);
  context.lineTo(baseLeft + normX * squareDepth, baseY + normY * squareDepth);
  context.lineTo(topX + normX * squareDepth, topY + normY * squareDepth);
  context.lineTo(topX, topY);
  context.closePath();
  context.fill();

  context.fillStyle = '#b7ffd6';
  context.beginPath();
  context.arc(baseLeft, baseY, width * 0.018, 0, Math.PI * 2);
  context.arc(baseRight, baseY, width * 0.018, 0, Math.PI * 2);
  context.arc(topX, topY, width * 0.018, 0, Math.PI * 2);
  context.fill();

  context.font = `${Math.max(10, width * 0.06)}px "IBM Plex Mono", monospace`;
  context.fillText('a^2 + b^2 = c^2', width * 0.04, height * 0.22);
  context.font = `${Math.max(9, width * 0.05)}px "IBM Plex Mono", monospace`;
  context.fillText('3^2 + 4^2 = 5^2', width * 0.04, height * 0.38);
  context.fillText('9 + 16 = 25', width * 0.04, height * 0.5);
}
