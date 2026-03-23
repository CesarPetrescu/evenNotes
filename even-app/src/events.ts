import { OsEventTypeList } from '@evenrealities/even_hub_sdk';
import type { EvenHubEvent } from '@evenrealities/even_hub_sdk';
import { state } from './state';
import { clamp } from './utils/text';
import { pageCount, currentPageNotes, currentPageOffset } from './utils/notes';
import { isClickLike } from './bridge/helpers';
import { isClickCooldownActive } from './utils/timing';
import { renderApp } from './render';
import { scheduleBridgeSync } from './bridge/sync';
import { enterDetail, returnToList, moveListSelection, moveDetailSelection } from './navigation';

export function handleListEvent(event: NonNullable<EvenHubEvent['listEvent']>) {
  const pageNotes = currentPageNotes();
  const lastIndex = Math.max(0, pageNotes.length - 1);
  const currentIndex = clamp(event.currentSelectItemIndex ?? state.selectedIndex, 0, lastIndex);

  if (currentIndex !== state.selectedIndex) {
    state.selectedIndex = currentIndex;
    renderApp();
  }

  switch (event.eventType) {
    case OsEventTypeList.SCROLL_BOTTOM_EVENT:
      if (currentIndex === lastIndex && state.listPage < pageCount() - 1) {
        state.listPage += 1;
        state.selectedIndex = 0;
        renderApp();
        scheduleBridgeSync();
        return;
      }
      break;
    case OsEventTypeList.SCROLL_TOP_EVENT:
      if (currentIndex === 0 && state.listPage > 0) {
        state.listPage -= 1;
        state.selectedIndex = Math.max(0, currentPageNotes().length - 1);
        renderApp();
        scheduleBridgeSync();
        return;
      }
      break;
  }

  if (isClickLike(event.eventType) && !isClickCooldownActive()) {
    if (pageNotes.length > 0) {
      enterDetail(currentPageOffset() + state.selectedIndex);
    }
  }
}

export function handleTextEvent(event: NonNullable<EvenHubEvent['textEvent']>) {
  if (state.view !== 'detail') {
    return;
  }

  switch (event.eventType) {
    case OsEventTypeList.SCROLL_BOTTOM_EVENT:
      moveDetailSelection(1);
      break;
    case OsEventTypeList.SCROLL_TOP_EVENT:
      moveDetailSelection(-1);
      break;
  }

  if (isClickLike(event.eventType) && !isClickCooldownActive()) {
    returnToList();
  }
}

export function handleSystemClick() {
  if (isClickCooldownActive()) {
    return;
  }

  if (state.view === 'detail') {
    returnToList();
    return;
  }

  if (state.notes.length > 0) {
    enterDetail(currentPageOffset() + state.selectedIndex);
  }
}

export function handleEvenHubEvent(event: EvenHubEvent) {
  if (event.listEvent) {
    handleListEvent(event.listEvent);
    return;
  }

  if (event.textEvent) {
    handleTextEvent(event.textEvent);
    return;
  }

  if (event.sysEvent?.eventType === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
    scheduleBridgeSync();
    return;
  }

  if (isClickLike(event.sysEvent?.eventType)) {
    handleSystemClick();
  }
}

export function setupKeyboardListeners() {
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (state.view === 'detail') {
          moveDetailSelection(1);
        } else {
          moveListSelection(1);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (state.view === 'detail') {
          moveDetailSelection(-1);
        } else {
          moveListSelection(-1);
        }
        break;
      case 'Enter':
        event.preventDefault();
        if (state.view === 'detail') {
          returnToList();
        } else if (state.notes.length > 0) {
          enterDetail(currentPageOffset() + state.selectedIndex);
        }
        break;
      case 'Escape':
        if (state.view === 'detail') {
          event.preventDefault();
          returnToList();
        }
        break;
    }
  });
}
