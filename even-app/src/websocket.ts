import type { Note } from './types';
import { state } from './state';
import { sortNotes, normalizeNotes } from './utils';
import { log, renderApp } from './render';
import { normalizeState, syncGlasses } from './glasses';

export function connectWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${proto}//${location.host}`);

  socket.addEventListener('open', () => {
    state.wsConnected = true;
    log('WebSocket connected');
  });

  socket.addEventListener('message', (raw) => {
    try {
      const msg = JSON.parse(raw.data as string) as { type?: string; data?: Note[] };
      if (msg.type !== 'notes' || !Array.isArray(msg.data)) return;

      state.notes = sortNotes(normalizeNotes(msg.data));
      normalizeState();
      renderApp();
      void syncGlasses();
    } catch (err) {
      log(`WS parse error: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

  socket.addEventListener('close', () => {
    state.wsConnected = false;
    renderApp();
    log('WebSocket disconnected, retrying');
    setTimeout(connectWebSocket, 3000);
  });

  socket.addEventListener('error', () => socket.close());
}
