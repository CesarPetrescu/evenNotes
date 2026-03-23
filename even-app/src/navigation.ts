import { NOTES_PER_PAGE } from './constants';
import { state } from './state';
import { clamp } from './utils/text';
import { pageCount, currentPageNotes, currentPageOffset } from './utils/notes';
import { clearVisualFallback } from './diagrams/detection';
import { armClickCooldown } from './utils/timing';
import { renderApp } from './render';
import { scheduleBridgeSync } from './bridge/sync';

export function enterDetail(noteIndex: number) {
  state.detailNoteIndex = clamp(noteIndex, 0, Math.max(0, state.notes.length - 1));
  clearVisualFallback();
  state.view = 'detail';
  armClickCooldown();
  renderApp();
  scheduleBridgeSync();
}

export function returnToList() {
  state.listPage = clamp(Math.floor(state.detailNoteIndex / NOTES_PER_PAGE), 0, pageCount() - 1);
  state.selectedIndex = clamp(state.detailNoteIndex - currentPageOffset(), 0, Math.max(0, currentPageNotes().length - 1));
  clearVisualFallback();
  state.view = 'list';
  armClickCooldown();
  renderApp();
  scheduleBridgeSync();
}

export function moveListSelection(delta: number) {
  if (state.notes.length === 0) {
    return;
  }

  const flatIndex = clamp(currentPageOffset() + state.selectedIndex + delta, 0, state.notes.length - 1);
  state.listPage = Math.floor(flatIndex / NOTES_PER_PAGE);
  state.selectedIndex = flatIndex % NOTES_PER_PAGE;
  renderApp();
}

export function moveDetailSelection(delta: number) {
  if (state.notes.length === 0) {
    return;
  }

  const nextIndex = clamp(state.detailNoteIndex + delta, 0, state.notes.length - 1);
  if (nextIndex === state.detailNoteIndex) {
    return;
  }

  state.detailNoteIndex = nextIndex;
  clearVisualFallback();
  renderApp();
  scheduleBridgeSync();
}
