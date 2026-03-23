import type { Note, NoteImage } from '../types';
import { NOTES_PER_PAGE } from '../constants';
import { state } from '../state';
import { clamp, truncate, singleLine } from './text';

export function sortNotes(notes: Note[]) {
  return [...notes].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return Number(right.pinned) - Number(left.pinned);
    }

    return Date.parse(right.updated_at) - Date.parse(left.updated_at);
  });
}

export function normalizeIncomingNotes(input: Note[]) {
  return input.map((note) => {
    const image: NoteImage | null = note.image && typeof note.image === 'object' && typeof note.image.dataUrl === 'string'
      ? {
        kind: note.image.kind === 'drawing' ? 'drawing' as const : 'upload' as const,
        mimeType: typeof note.image.mimeType === 'string' ? note.image.mimeType : 'image/png',
        dataUrl: note.image.dataUrl,
        width: typeof note.image.width === 'number' ? note.image.width : undefined,
        height: typeof note.image.height === 'number' ? note.image.height : undefined
      }
      : null;

    return {
      ...note,
      title: typeof note.title === 'string' ? note.title : 'Untitled',
      content: typeof note.content === 'string' ? note.content : '',
      image,
      pinned: Boolean(note.pinned),
      created_at: typeof note.created_at === 'string' ? note.created_at : new Date().toISOString(),
      updated_at: typeof note.updated_at === 'string' ? note.updated_at : new Date().toISOString()
    };
  });
}

export function detailDateStamp(note: Note) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(note.updated_at));
}

export function detailBodyText(note: Note) {
  return note.content.trim()
    || (note.image ? `${note.image.kind === 'drawing' ? 'Sketch' : 'Image'} note\nVisual rendering fallback active.` : '(empty)');
}

export function detailText(note: Note) {
  const body = note.content.trim()
    || (note.image ? `${note.image.kind === 'drawing' ? 'Sketch' : 'Image'} note` : '(empty)');
  const lines = [
    singleLine(note.title || 'Untitled'),
    '',
    body
  ];

  return lines.join('\n').replace(/\r\n/g, '\n');
}

export function listItemLabel(note: Note) {
  const title = singleLine(note.title || 'Untitled');
  const updated = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(note.updated_at));
  const media = note.image ? 'img ' : '';
  const prefix = note.pinned ? '* ' : '';

  return truncate(`${prefix}${media}${title} | ${updated}`, 64);
}

export function listPreview(note: Note) {
  if (note.content) {
    return truncate(singleLine(note.content), 40);
  }

  if (note.image) {
    return note.image.kind === 'drawing' ? 'Sketch note' : 'Image note';
  }

  return '(empty)';
}

export function pageCount() {
  return Math.max(1, Math.ceil(state.notes.length / NOTES_PER_PAGE));
}

export function currentPageNotes() {
  const start = state.listPage * NOTES_PER_PAGE;
  return state.notes.slice(start, start + NOTES_PER_PAGE);
}

export function currentPageOffset() {
  return state.listPage * NOTES_PER_PAGE;
}

export function activeDetailNote() {
  return state.notes[state.detailNoteIndex] ?? null;
}

export function normalizeState() {
  state.listPage = clamp(state.listPage, 0, pageCount() - 1);

  const pageNotes = currentPageNotes();
  state.selectedIndex = clamp(state.selectedIndex, 0, Math.max(0, pageNotes.length - 1));

  if (state.notes.length === 0) {
    state.view = 'list';
    state.detailNoteIndex = 0;
    state.listPage = 0;
    state.selectedIndex = 0;
    return;
  }

  state.detailNoteIndex = clamp(state.detailNoteIndex, 0, state.notes.length - 1);
}
