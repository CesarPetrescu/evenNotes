export const NOTES_PER_PAGE = 6;
export const MAX_STARTUP_TEXT = 1000;
export const BRIDGE_WAIT_MS = 3000;
export const WS_RETRY_MS = 3000;
export const DIAGRAM_IMAGE_WIDTH = 200;
export const DIAGRAM_IMAGE_HEIGHT = 100;
export const RUNTIME_VERSION = '0.1.1';
export const GLASSES_LINE_WIDTH = 28;
export const GLASSES_FALLBACK_LINE_WIDTH = 24;
export const GLASSES_BODY_LINES = 6;
export const GLASSES_FALLBACK_BODY_LINES = 4;
export const GLASSES_TITLE_LINES = 2;

export const CONTAINERS = {
  listHeader: 1,
  listBody: 2,
  listFooter: 3,
  detailHeader: 4,
  detailBody: 5,
  detailFooter: 6,
  emptyHeader: 7,
  emptyBody: 8,
  detailImage: 9
} as const;
