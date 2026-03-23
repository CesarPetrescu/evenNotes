import type { Note } from './types';
import { WS_RETRY_MS } from './constants';
import { state } from './state';
import { sortNotes, normalizeIncomingNotes, normalizeState } from './utils/notes';
import { clearVisualFallback } from './diagrams/detection';
import { pushLog, renderApp } from './render';
import { scheduleBridgeSync } from './bridge/sync';

export function connectWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${protocol}//${location.host}`);
  state.ws = socket;

  socket.addEventListener('open', () => {
    state.wsConnected = true;
    pushLog('WebSocket connected');
  });

  socket.addEventListener('message', (rawEvent) => {
    try {
      const event = JSON.parse(rawEvent.data as string) as { type?: string; data?: Note[] };
      if (event.type !== 'notes' || !Array.isArray(event.data)) {
        return;
      }

      state.notes = sortNotes(normalizeIncomingNotes(event.data));
      if (state.visualFallbackNoteId && !state.notes.some((note) => note.id === state.visualFallbackNoteId)) {
        clearVisualFallback();
      }
      normalizeState();
      renderApp();
      scheduleBridgeSync();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      pushLog(`WebSocket parse error: ${message}`);
    }
  });

  socket.addEventListener('close', () => {
    state.wsConnected = false;
    renderApp();
    pushLog('WebSocket disconnected, retrying');
    window.setTimeout(connectWebSocket, WS_RETRY_MS);
  });

  socket.addEventListener('error', () => {
    socket.close();
  });
}
