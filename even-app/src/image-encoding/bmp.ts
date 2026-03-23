export function canvasToBmpBytes(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas 2D context unavailable');
  }

  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  const rowStride = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowStride * height;
  const fileSize = 54 + pixelArraySize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  let offset = 54;

  for (let y = height - 1; y >= 0; y -= 1) {
    const rowStart = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowStart + x * 4;
      bytes[offset] = data[pixelOffset + 2];
      bytes[offset + 1] = data[pixelOffset + 1];
      bytes[offset + 2] = data[pixelOffset];
      offset += 3;
    }

    while ((offset - 54) % rowStride !== 0) {
      bytes[offset] = 0;
      offset += 1;
    }
  }

  return bytes;
}
