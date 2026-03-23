import type { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';

export type NoteImage = {
  kind: 'upload' | 'drawing';
  mimeType: string;
  dataUrl: string;
  width?: number;
  height?: number;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  image: NoteImage | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type DiagramKind = 'pythagoras' | 'bezier';

export type ViewMode = 'list' | 'detail' | 'menu' | 'image';

export type MenuAction = 'next' | 'prev' | 'back' | 'view-image';

export type Bridge = Awaited<ReturnType<typeof waitForEvenAppBridge>>;
