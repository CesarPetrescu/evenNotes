import type { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';
import type {
  CreateStartUpPageContainer,
  RebuildPageContainer
} from '@evenrealities/even_hub_sdk';

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
export type VisualKind =
  | { type: 'diagram'; kind: DiagramKind }
  | { type: 'image'; image: NoteImage };
export type PageKind = 'empty' | 'list' | 'detail-text' | 'detail-image';
export type ViewMode = 'list' | 'detail';
export type BridgeInstance = Awaited<ReturnType<typeof waitForEvenAppBridge>>;
export type DiagramImageEncoding = {
  label: 'gray4' | 'bmp';
  imageData: number[];
};
export type DiagramImageUpdate = {
  containerID: number;
  containerName: string;
  attempts: DiagramImageEncoding[];
};

export type GlassesPage = {
  pageKind: PageKind;
  syncLabel: string;
  noteId?: string;
  create: CreateStartUpPageContainer;
  rebuild: RebuildPageContainer;
  imageUpdate?: DiagramImageUpdate;
};
