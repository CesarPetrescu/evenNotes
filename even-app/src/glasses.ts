import {
  CreateStartUpPageContainer,
  ImageContainerProperty,
  ImageRawDataUpdate,
  ListContainerProperty,
  ListItemContainerProperty,
  OsEventTypeList,
  TextContainerProperty,
  waitForEvenAppBridge
} from '@evenrealities/even_hub_sdk';
import type { MenuAction, Note } from './types';
import { state, NOTES_PER_PAGE, BASE_MENU_OPTIONS } from './state';
import { clamp, truncate, singleLine, wrapText } from './utils';
import { getDiagramKind, encodeDiagramTiles, encodeImageTiles } from './images';
import type { TileData } from './images';
import { log, renderApp } from './render';

// ── Helpers ──

function pageCount() {
  return Math.max(1, Math.ceil(state.notes.length / NOTES_PER_PAGE));
}

function pageNotes() {
  const start = state.listPage * NOTES_PER_PAGE;
  return state.notes.slice(start, start + NOTES_PER_PAGE);
}

function pageOffset() {
  return state.listPage * NOTES_PER_PAGE;
}

function itemLabel(note: Note) {
  const title = singleLine(note.title || 'Untitled');
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(note.updated_at));
  const prefix = note.pinned ? '* ' : '';
  const media = note.image ? 'img ' : '';
  return truncate(`${prefix}${media}${title} | ${time}`, 64);
}

function detailStamp(note: Note) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(note.updated_at));
}

function detailBody(note: Note) {
  return note.content.trim()
    || (note.image ? `${note.image.kind === 'drawing' ? 'Sketch' : 'Image'} note` : '(empty)');
}

function noteHasVisual(note: Note) {
  return getDiagramKind(note.title) !== null || Boolean(note.image?.dataUrl);
}

function firstTwoWords(text: string) {
  return singleLine(text || 'Untitled').split(/\s+/).slice(0, 2).join(' ');
}

// ── Dynamic menu options for current note ──

export function currentMenuOptions(): { action: MenuAction; label: string }[] {
  const note = state.notes[state.detailIndex];
  const nextNote = state.notes[state.detailIndex + 1];
  const prevNote = state.notes[state.detailIndex - 1];

  const options: { action: MenuAction; label: string }[] = [];

  // VIEW IMAGE — only if note has visual content
  if (note && noteHasVisual(note)) {
    options.push({ action: 'view-image', label: 'VIEW IMAGE' });
  }

  // NEXT / PREV with preview
  for (const base of BASE_MENU_OPTIONS) {
    if (base.action === 'next') {
      options.push({
        action: 'next',
        label: nextNote ? `NEXT: ${firstTwoWords(nextNote.title)}` : 'NEXT (LAST NOTE)'
      });
    } else if (base.action === 'prev') {
      options.push({
        action: 'prev',
        label: prevNote ? `PREV: ${firstTwoWords(prevNote.title)}` : 'PREV (FIRST NOTE)'
      });
    } else {
      options.push(base);
    }
  }

  return options;
}

// ── Page creation (always shutdown + create) ──

async function showPage(definition: Record<string, unknown>) {
  if (!state.bridge) return false;

  const first = await state.bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer(definition)
  );
  log(`Create: ${first} (${typeof first})`);
  if (Number(first) === 0) return true;

  try { await state.bridge.shutDownPageContainer(0); } catch (err) {
    log(`Shutdown: ${err instanceof Error ? err.message : String(err)}`);
  }
  await new Promise((r) => setTimeout(r, 200));

  const retry = await state.bridge.createStartUpPageContainer(
    new CreateStartUpPageContainer(definition)
  );
  log(`Recreate after shutdown: ${retry} (${typeof retry})`);
  return Number(retry) === 0;
}

// ── List page ──

async function showListPage() {
  const notes = pageNotes();
  return showPage({
    containerTotalNum: 2,
    textObject: [
      new TextContainerProperty({
        containerID: 1, containerName: 'hdr',
        xPosition: 0, yPosition: 0, width: 576, height: 48,
        content: `EVEN NOTES  PAGE ${state.listPage + 1}/${pageCount()}\n${state.notes.length} NOTES / CLICK TO OPEN`,
        isEventCapture: 0
      })
    ],
    listObject: [
      new ListContainerProperty({
        containerID: 2, containerName: 'list',
        xPosition: 0, yPosition: 54, width: 576, height: 234,
        itemContainer: new ListItemContainerProperty({
          itemCount: Math.max(1, notes.length),
          itemWidth: 0,
          isItemSelectBorderEn: 1,
          itemName: notes.length > 0 ? notes.map(itemLabel) : ['No notes yet.']
        }),
        isEventCapture: 1
      })
    ]
  });
}

// ── Empty page ──

async function showEmptyPage() {
  return showPage({
    containerTotalNum: 2,
    textObject: [
      new TextContainerProperty({
        containerID: 1, containerName: 'hdr',
        xPosition: 0, yPosition: 0, width: 576, height: 52,
        content: 'EVEN NOTES\nWAITING FOR NOTES',
        isEventCapture: 0
      }),
      new TextContainerProperty({
        containerID: 2, containerName: 'body',
        xPosition: 0, yPosition: 60, width: 576, height: 200,
        content: 'OPEN THE ADMIN PANEL AND CREATE A NOTE.\nTHE GLASSES VIEW WILL REFRESH OVER WEBSOCKET.',
        isEventCapture: 1
      })
    ]
  });
}

// ── Detail page — always text, shows full note content ──

async function showDetailTextPage(note: Note) {
  const stamp = detailStamp(note);
  const hasImage = noteHasVisual(note);
  const meta = `NOTE ${state.detailIndex + 1}/${state.notes.length} | ${stamp}${note.pinned ? ' | PINNED' : ''}`;
  const title = singleLine(note.title || 'Untitled');
  const hint = hasImage ? 'CLICK FOR ACTIONS / HAS IMAGE' : 'CLICK FOR ACTIONS';

  const overhead = meta.length + title.length + hint.length + 10;
  const bodyBudget = Math.max(200, 1000 - overhead);
  const body = wrapText(detailBody(note), 28, 30, bodyBudget);
  const content = truncate([meta, title, '', body, '', hint].join('\n'), 1000);

  return showPage({
    containerTotalNum: 1,
    textObject: [
      new TextContainerProperty({
        containerID: 1, containerName: 'detail',
        xPosition: 0, yPosition: 0, width: 576, height: 288,
        content,
        isEventCapture: 1
      })
    ]
  });
}

// ── Image view — tiled across 3 image containers (400x200) ──

async function showImagePage(note: Note) {
  // Encode tiles
  let tiles: TileData[];
  const diagramKind = getDiagramKind(note.title);
  if (diagramKind) {
    tiles = encodeDiagramTiles(diagramKind);
  } else if (note.image?.dataUrl) {
    tiles = await encodeImageTiles(note.image);
  } else {
    return false;
  }

  // Create page: 1 hidden text (event capture) + 3 image tiles = 4 containers
  const pageCreated = await showPage({
    containerTotalNum: 4,
    textObject: [
      new TextContainerProperty({
        containerID: 1, containerName: 'tap',
        xPosition: 0, yPosition: 0, width: 576, height: 288,
        content: ' ',
        isEventCapture: 1
      })
    ],
    imageObject: tiles.map((t) =>
      new ImageContainerProperty({
        containerID: t.id, containerName: t.name,
        xPosition: t.x, yPosition: t.y, width: t.w, height: t.h
      })
    )
  });

  if (!pageCreated || !state.bridge) return false;

  // Wait for firmware to init image containers
  await new Promise((r) => setTimeout(r, 300));

  // Upload each tile sequentially
  let allOk = true;
  for (const tile of tiles) {
    for (let round = 0; round < 2; round++) {
      if (round > 0) await new Promise((r) => setTimeout(r, 400));

      const raw: unknown = await state.bridge!.updateImageRawData(new ImageRawDataUpdate({
        containerID: tile.id, containerName: tile.name, imageData: tile.bmp
      }));
      log(`Tile ${tile.name}: ${raw} (${typeof raw})`);

      const s = String(raw).trim().toLowerCase();
      if (raw === 0 || raw === true || s === '0' || s === 'true' || s.endsWith('success')) break;

      if (round === 1) {
        log(`Tile ${tile.name} failed`);
        allOk = false;
      }
    }

    // Small delay between tiles to not overwhelm firmware
    await new Promise((r) => setTimeout(r, 100));
  }

  if (!allOk) log('Some tiles failed');
  return allOk;
}

// ── Menu page ──

async function showMenuPage() {
  const note = state.notes[state.detailIndex];
  const title = singleLine(note.title || 'Untitled');
  const options = currentMenuOptions();

  return showPage({
    containerTotalNum: 3,
    textObject: [
      new TextContainerProperty({
        containerID: 1, containerName: 'hdr',
        xPosition: 0, yPosition: 0, width: 576, height: 56,
        content: wrapText(`NOTE ${state.detailIndex + 1}/${state.notes.length}\n${title}`, 24, 2, 96),
        isEventCapture: 0
      }),
      new TextContainerProperty({
        containerID: 3, containerName: 'ftr',
        xPosition: 0, yPosition: 224, width: 576, height: 64,
        content: 'SCROLL TO CHOOSE / CLICK TO SELECT',
        isEventCapture: 0
      })
    ],
    listObject: [
      new ListContainerProperty({
        containerID: 2, containerName: 'menu',
        xPosition: 0, yPosition: 62, width: 576, height: 156,
        itemContainer: new ListItemContainerProperty({
          itemCount: options.length,
          itemWidth: 0,
          isItemSelectBorderEn: 1,
          itemName: options.map((o) => o.label)
        }),
        isEventCapture: 1
      })
    ]
  });
}

// ── Sync ──

let syncQueued = false;
let syncing = false;

export async function syncGlasses() {
  if (!state.bridge || syncQueued) return;
  syncQueued = true;
  await new Promise((r) => setTimeout(r, 50));
  syncQueued = false;

  if (!state.bridge) return;
  syncing = true;

  try {
    if (state.notes.length === 0) {
      log('Sync: empty');
      await showEmptyPage();
    } else if (state.view === 'menu') {
      log(`Sync: menu for note ${state.detailIndex + 1}/${state.notes.length}`);
      await showMenuPage();
    } else if (state.view === 'image') {
      const note = state.notes[state.detailIndex];
      log(`Sync: image for note ${state.detailIndex + 1}/${state.notes.length}`);
      const ok = await showImagePage(note);
      if (!ok) {
        log('Image view failed, showing text');
        state.view = 'detail';
        renderApp();
        await showDetailTextPage(note);
      }
    } else if (state.view === 'detail') {
      log(`Sync: detail ${state.detailIndex + 1}/${state.notes.length}`);
      await showDetailTextPage(state.notes[state.detailIndex]);
    } else {
      log(`Sync: list page ${state.listPage + 1}/${pageCount()}`);
      await showListPage();
    }
  } catch (err) {
    log(`Sync error: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    syncing = false;
  }
}

// ── Navigation ──

export function enterDetail(noteIndex: number) {
  state.detailIndex = clamp(noteIndex, 0, Math.max(0, state.notes.length - 1));
  state.view = 'detail';
  renderApp();
  void syncGlasses();
}

export function returnToList() {
  state.listPage = clamp(Math.floor(state.detailIndex / NOTES_PER_PAGE), 0, pageCount() - 1);
  state.selectedIndex = clamp(state.detailIndex - pageOffset(), 0, Math.max(0, pageNotes().length - 1));
  state.view = 'list';
  renderApp();
  void syncGlasses();
}

export function openMenu(defaultIndex: number) {
  if (state.notes.length === 0) return;
  state.menuDefault = defaultIndex;
  state.view = 'menu';
  renderApp();
  void syncGlasses();
}

export function executeMenu(action: string) {
  switch (action) {
    case 'next':
      if (state.detailIndex < state.notes.length - 1) state.detailIndex += 1;
      state.view = 'detail';
      break;
    case 'prev':
      if (state.detailIndex > 0) state.detailIndex -= 1;
      state.view = 'detail';
      break;
    case 'view-image':
      state.view = 'image';
      break;
    case 'back':
      returnToList();
      return;
  }
  renderApp();
  void syncGlasses();
}

export function closeMenu() {
  state.view = 'detail';
  renderApp();
  void syncGlasses();
}

export function moveList(delta: number) {
  if (state.notes.length === 0) return;
  const flat = clamp(pageOffset() + state.selectedIndex + delta, 0, state.notes.length - 1);
  state.listPage = Math.floor(flat / NOTES_PER_PAGE);
  state.selectedIndex = flat % NOTES_PER_PAGE;
}

export function normalizeState() {
  state.listPage = clamp(state.listPage, 0, pageCount() - 1);
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, pageNotes().length - 1));
  if (state.notes.length === 0) {
    state.view = 'list';
    state.detailIndex = 0;
    state.listPage = 0;
    state.selectedIndex = 0;
    return;
  }
  state.detailIndex = clamp(state.detailIndex, 0, state.notes.length - 1);
}

// ── Event handling ──

export function setupBridgeEvents() {
  if (!state.bridge) return;

  state.bridge.onEvenHubEvent((event: Record<string, unknown>) => {
    if (syncing) return;

    const e = event as {
      listEvent?: { eventType?: number; currentSelectItemIndex?: number; containerName?: string };
      textEvent?: { eventType?: number; containerName?: string };
      sysEvent?: { eventType?: number };
    };

    // ── List events (list view or menu view) ──
    if (e.listEvent) {
      const le = e.listEvent;

      if (state.view === 'menu') {
        const options = currentMenuOptions();
        const idx = clamp(le.currentSelectItemIndex ?? 0, 0, options.length - 1);
        if (le.eventType === OsEventTypeList.CLICK_EVENT || le.eventType === undefined) {
          executeMenu(options[idx].action);
        }
        return;
      }

      const notes = pageNotes();
      const last = Math.max(0, notes.length - 1);
      const idx = clamp(le.currentSelectItemIndex ?? state.selectedIndex, 0, last);
      state.selectedIndex = idx;

      if (le.eventType === OsEventTypeList.SCROLL_BOTTOM_EVENT) {
        if (idx === last && state.listPage < pageCount() - 1) {
          state.listPage += 1;
          state.selectedIndex = 0;
          void syncGlasses();
        }
      } else if (le.eventType === OsEventTypeList.SCROLL_TOP_EVENT) {
        if (idx === 0 && state.listPage > 0) {
          state.listPage -= 1;
          state.selectedIndex = Math.max(0, pageNotes().length - 1);
          void syncGlasses();
        }
      } else if (le.eventType === OsEventTypeList.CLICK_EVENT || le.eventType === undefined) {
        if (notes.length > 0) enterDetail(pageOffset() + state.selectedIndex);
      }
      return;
    }

    // ── Text events (scroll — ignore) ──
    if (e.textEvent) {
      return;
    }

    // ── System events ──
    if (e.sysEvent) {
      if (e.sysEvent.eventType === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
        void syncGlasses();
        return;
      }

      // Click on text container = sysEvent with no eventType
      if (e.sysEvent.eventType === undefined) {
        if (state.view === 'detail') {
          openMenu(0);
        } else if (state.view === 'image') {
          // Click from image view → back to detail text
          state.view = 'detail';
          renderApp();
          void syncGlasses();
        }
      }
    }
  });
}

// ── Bridge connection ──

export async function connectBridge() {
  if (state.bridge) return;
  try {
    const bridge = await Promise.race([
      waitForEvenAppBridge(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    state.bridge = bridge;
    state.bridgeReady = true;
    log('Bridge connected');
    setupBridgeEvents();
    void syncGlasses();
  } catch {
    log('Bridge not available (preview mode)');
  }
}
