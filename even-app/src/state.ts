import type { BridgeInstance, Note, ViewMode } from './types';

export const state = {
  notes: [] as Note[],
  ws: null as WebSocket | null,
  wsConnected: false,
  bridge: null as BridgeInstance | null,
  bridgeConnected: false,
  startupCreated: false,
  bridgeSync: Promise.resolve(),
  listPage: 0,
  selectedIndex: 0,
  detailNoteIndex: 0,
  view: 'list' as ViewMode,
  logs: [] as string[],
  clickCooldownUntil: 0,
  visualFallbackNoteId: null as string | null,
  lastSyncLabel: ''
};

export const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app root');
}
