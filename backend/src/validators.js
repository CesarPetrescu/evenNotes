const { v4: uuidv4 } = require('uuid');

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function normalizeText(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeBoolean(value, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : undefined;
}

function normalizeImagePayload(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const dataUrl = normalizeText(value.dataUrl);
  const mimeType = normalizeText(value.mimeType).toLowerCase();
  const kind = value.kind === 'drawing' ? 'drawing' : 'upload';

  if (!dataUrl.startsWith('data:')) {
    return null;
  }

  const mimeMatch = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(dataUrl);
  const detectedMimeType = mimeMatch?.[1]?.toLowerCase();
  const finalMimeType = ALLOWED_IMAGE_MIME_TYPES.has(mimeType) ? mimeType : detectedMimeType;

  if (!finalMimeType || !ALLOWED_IMAGE_MIME_TYPES.has(finalMimeType)) {
    return null;
  }

  return {
    kind,
    mimeType: finalMimeType,
    dataUrl,
    width: normalizeNumber(value.width),
    height: normalizeNumber(value.height)
  };
}

function createNoteFromInput(input = {}) {
  const timestamp = new Date().toISOString();

  return {
    id: uuidv4(),
    title: normalizeText(input.title, 'Untitled'),
    content: normalizeText(input.content),
    image: normalizeImagePayload(input.image),
    pinned: normalizeBoolean(input.pinned),
    created_at: timestamp,
    updated_at: timestamp
  };
}

module.exports = {
  ALLOWED_IMAGE_MIME_TYPES,
  normalizeText,
  normalizeBoolean,
  normalizeNumber,
  normalizeImagePayload,
  createNoteFromInput
};
