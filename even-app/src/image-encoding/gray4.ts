export function canvasToGray4Bytes(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  const packed = new Uint8Array((width * height) / 2);

  for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 2) {
    const leftOffset = pixelIndex * 4;
    const rightOffset = leftOffset + 4;

    const left = Math.min(
      15,
      Math.round(
        (0.299 * data[leftOffset] + 0.587 * data[leftOffset + 1] + 0.114 * data[leftOffset + 2]) / 17
      )
    );

    const right = Math.min(
      15,
      Math.round(
        (0.299 * data[rightOffset] + 0.587 * data[rightOffset + 1] + 0.114 * data[rightOffset + 2]) / 17
      )
    );

    packed[pixelIndex / 2] = (left << 4) | right;
  }

  return packed;
}
