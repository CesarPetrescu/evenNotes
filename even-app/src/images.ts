import type { DiagramKind, NoteImage } from './types';

// Tile config: 2 tiles side by side (max 4 containers - 1 event capture - 1 spare)
// Each tile max 200x100 per SDK limit
// Layout: 2 tiles side by side = 400x100, nothing cut off
export const TILE_W = 200;
export const TILE_H = 100;
export const FULL_W = TILE_W * 2; // 400
export const FULL_H = TILE_H;     // 100

export type TileData = {
  id: number;
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bmp: number[];
};

// Tile positions on the 576x288 display (centered)
const DISPLAY_W = 576;
const DISPLAY_H = 288;
const OFFSET_X = Math.floor((DISPLAY_W - FULL_W) / 2); // 88
const OFFSET_Y = Math.floor((DISPLAY_H - FULL_H) / 2); // 44

export const TILE_LAYOUT = [
  { id: 2, name: 'tl', x: OFFSET_X, y: OFFSET_Y, srcX: 0, srcY: 0 },
  { id: 3, name: 'tr', x: OFFSET_X + TILE_W, y: OFFSET_Y, srcX: TILE_W, srcY: 0 }
];

// ── Diagram drawing ──

function drawPythagoras(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const bL = w * 0.14, bY = h * 0.84, bR = w * 0.58, tX = w * 0.58, tY = h * 0.34;
  const ss = h * 0.24, ls = w * 0.22;
  const dx = tX - bL, dy = tY - bY, len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len, sd = h * 0.13;

  ctx.strokeStyle = '#b7ffd6';
  ctx.lineWidth = Math.max(2, w * 0.012);

  ctx.beginPath(); ctx.moveTo(bL, bY); ctx.lineTo(bR, bY); ctx.lineTo(tX, tY); ctx.closePath(); ctx.stroke();
  ctx.strokeRect(bR, bY - ss, ss, ss);
  ctx.strokeRect(bL, bY, ls, ls);

  ctx.beginPath();
  ctx.moveTo(bL, bY); ctx.lineTo(bL + nx * sd, bY + ny * sd);
  ctx.lineTo(tX + nx * sd, tY + ny * sd); ctx.lineTo(tX, tY); ctx.stroke();

  ctx.fillStyle = 'rgba(183,255,214,0.12)';
  ctx.fillRect(bR, bY - ss, ss, ss);
  ctx.fillRect(bL, bY, ls, ls);
  ctx.beginPath(); ctx.moveTo(bL, bY); ctx.lineTo(bL + nx * sd, bY + ny * sd);
  ctx.lineTo(tX + nx * sd, tY + ny * sd); ctx.lineTo(tX, tY); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#b7ffd6';
  for (const [px, py] of [[bL, bY], [bR, bY], [tX, tY]]) {
    ctx.beginPath(); ctx.arc(px, py, w * 0.018, 0, Math.PI * 2); ctx.fill();
  }

  ctx.font = `${Math.max(10, w * 0.04)}px monospace`;
  ctx.fillText('a² + b² = c²', w * 0.04, h * 0.18);
  ctx.font = `${Math.max(9, w * 0.032)}px monospace`;
  ctx.fillText('3² + 4² = 5²  →  9 + 16 = 25', w * 0.04, h * 0.28);
}

function drawBezier(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const s = { x: w * 0.08, y: h * 0.74 };
  const cA = { x: w * 0.28, y: h * 0.12 };
  const cB = { x: w * 0.56, y: h * 0.14 };
  const e = { x: w * 0.92, y: h * 0.72 };

  ctx.strokeStyle = 'rgba(183,255,214,0.46)';
  ctx.lineWidth = Math.max(1.5, w * 0.008);
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(cA.x, cA.y); ctx.lineTo(cB.x, cB.y); ctx.lineTo(e.x, e.y); ctx.stroke();

  ctx.setLineDash([]);
  ctx.strokeStyle = '#b7ffd6';
  ctx.lineWidth = Math.max(2.5, w * 0.015);
  ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.bezierCurveTo(cA.x, cA.y, cB.x, cB.y, e.x, e.y); ctx.stroke();

  ctx.fillStyle = '#b7ffd6';
  for (const p of [s, cA, cB, e]) {
    ctx.beginPath(); ctx.arc(p.x, p.y, w * 0.016, 0, Math.PI * 2); ctx.fill();
  }

  ctx.font = `${Math.max(9, w * 0.032)}px monospace`;
  ctx.fillText('Cubic Bézier control flow', w * 0.08, h * 0.93);
}

export function drawDiagram(kind: DiagramKind, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (kind === 'pythagoras') drawPythagoras(ctx, canvas.width, canvas.height);
  else drawBezier(ctx, canvas.width, canvas.height);
}

export function getDiagramKind(title: string): DiagramKind | null {
  const t = title.toLowerCase();
  if (t.includes('pythagoras')) return 'pythagoras';
  if (t.includes('bezier')) return 'bezier';
  return null;
}

// ── Encoding ──

function canvasToBmp(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const { width: w, height: h } = canvas;
  const { data } = ctx.getImageData(0, 0, w, h);
  const rowStride = Math.ceil((w * 3) / 4) * 4;
  const pixSize = rowStride * h;
  const fileSize = 54 + pixSize;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);

  view.setUint8(0, 0x42); view.setUint8(1, 0x4d);
  view.setUint32(2, fileSize, true); view.setUint32(10, 54, true);
  view.setUint32(14, 40, true); view.setInt32(18, w, true); view.setInt32(22, h, true);
  view.setUint16(26, 1, true); view.setUint16(28, 24, true);
  view.setUint32(34, pixSize, true); view.setInt32(38, 2835, true); view.setInt32(42, 2835, true);

  let offset = 54;
  for (let y = h - 1; y >= 0; y--) {
    const row = y * w * 4;
    for (let x = 0; x < w; x++) {
      const p = row + x * 4;
      bytes[offset] = data[p + 2]; bytes[offset + 1] = data[p + 1]; bytes[offset + 2] = data[p];
      offset += 3;
    }
    while ((offset - 54) % rowStride !== 0) { bytes[offset++] = 0; }
  }
  return bytes;
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function loadImg(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = dataUrl;
  });
}

// ── Slice a full-size canvas into tiles ──

function sliceTiles(fullCanvas: HTMLCanvasElement): TileData[] {
  return TILE_LAYOUT.map((t) => {
    const tile = makeCanvas(TILE_W, TILE_H);
    const ctx = tile.getContext('2d', { willReadFrequently: true })!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, TILE_W, TILE_H);
    // Copy the region from the full canvas
    ctx.drawImage(fullCanvas, t.srcX, t.srcY, TILE_W, TILE_H, 0, 0, TILE_W, TILE_H);
    return {
      id: t.id,
      name: t.name,
      x: t.x,
      y: t.y,
      w: TILE_W,
      h: TILE_H,
      bmp: Array.from(canvasToBmp(tile))
    };
  });
}

// ── Public: encode diagram as tiles ──

export function encodeDiagramTiles(kind: DiagramKind): TileData[] {
  const canvas = makeCanvas(FULL_W, FULL_H);
  drawDiagram(kind, canvas);
  return sliceTiles(canvas);
}

// ── Public: encode uploaded/drawn image as tiles ──

export async function encodeImageTiles(image: NoteImage): Promise<TileData[]> {
  const el = await loadImg(image.dataUrl);
  const canvas = makeCanvas(FULL_W, FULL_H);
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, FULL_W, FULL_H);
  const iw = el.naturalWidth || el.width, ih = el.naturalHeight || el.height;
  const scale = Math.min(FULL_W / iw, FULL_H / ih);
  const dw = iw * scale, dh = ih * scale;
  ctx.drawImage(el, (FULL_W - dw) / 2, (FULL_H - dh) / 2, dw, dh);

  return sliceTiles(canvas);
}
