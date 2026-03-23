import type { Bridge, MenuAction, Note, ViewMode } from './types';

export const NOTES_PER_PAGE = 6;

export const BASE_MENU_OPTIONS: { action: MenuAction; label: string }[] = [
  { action: 'next', label: 'NEXT NOTE' },
  { action: 'prev', label: 'PREVIOUS NOTE' },
  { action: 'back', label: 'BACK TO LIST' }
];

export const state = {
  notes: [] as Note[],
  bridge: null as Bridge | null,
  bridgeReady: false,
  wsConnected: false,
  view: 'list' as ViewMode,
  listPage: 0,
  selectedIndex: 0,
  detailIndex: 0,
  menuDefault: 0,
  logs: [] as string[]
};

export const app = document.querySelector<HTMLDivElement>('#app')!;
