import type { DiagramKind, Note, NoteImage, VisualKind } from '../types';
import { state } from '../state';
import { truncate, singleLine } from '../utils/text';

export function getDiagramKind(note: Note): DiagramKind | null {
  const title = note.title.toLowerCase();

  if (title.includes('pythagoras')) {
    return 'pythagoras';
  }

  if (title.includes('bezier')) {
    return 'bezier';
  }

  return null;
}

export function getVisualKind(note: Note): VisualKind | null {
  if (state.visualFallbackNoteId === note.id) {
    return null;
  }

  const diagramKind = getDiagramKind(note);
  if (diagramKind) {
    return { type: 'diagram', kind: diagramKind };
  }

  if (note.image?.dataUrl) {
    return { type: 'image', image: note.image };
  }

  return null;
}

export function visualCaption(note: Note, visualKind: VisualKind) {
  if (visualKind.type === 'diagram') {
    switch (visualKind.kind) {
      case 'pythagoras':
        return 'Rendered geometry: the leg squares add to the hypotenuse square.';
      case 'bezier':
        return 'Rendered geometry: control handles shape the smooth Bezier path.';
    }
  }

  if (note.content) {
    return truncate(singleLine(note.content), 160);
  }

  return (visualKind as { type: 'image'; image: NoteImage }).image.kind === 'drawing'
    ? 'Rendered sketch note from the phone canvas drawer.'
    : 'Rendered uploaded image note from the phone editor.';
}

export function diagramCaption(kind: DiagramKind) {
  switch (kind) {
    case 'pythagoras':
      return 'Vector diagram: the square areas on the two legs combine into the square on the hypotenuse.';
    case 'bezier':
      return 'Vector diagram: control handles pull the curve while the path stays smooth between the endpoints.';
  }
}

export function clearVisualFallback() {
  state.visualFallbackNoteId = null;
}
