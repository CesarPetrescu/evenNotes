import type { Note } from './types';
import { state, app } from './state';
import { truncate, escapeHtml } from './utils/text';
import { detailText, pageCount, currentPageNotes } from './utils/notes';
import { getVisualKind, visualCaption } from './diagrams/detection';
import { drawDiagram } from './diagrams/draw-diagram';
import { loadImageElement, drawAttachmentImage } from './image-encoding/encode-attachment';

export function pushLog(message: string) {
  const timestamp = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  state.logs.unshift(`${timestamp} ${message}`);
  state.logs = state.logs.slice(0, 8);
  renderApp();
}

export function selectedPreviewNote() {
  if (state.notes.length === 0) {
    return null;
  }

  if (state.view === 'detail') {
    return state.notes[state.detailNoteIndex];
  }

  return currentPageNotes()[state.selectedIndex] ?? null;
}

export function renderPreviewScreen() {
  if (state.notes.length === 0) {
    return `
      <div class="screen-header">
        <span>EVEN NOTES</span>
        <span>WAITING</span>
      </div>
      <div class="screen-empty">
        <p>No notes yet.</p>
        <p>Create one from /admin and this view will sync.</p>
      </div>
    `;
  }

  if (state.view === 'detail') {
    const note = state.notes[state.detailNoteIndex];
    const visualKind = getVisualKind(note);

    if (visualKind) {
      return `
        <div class="screen-header">
          <span>NOTE ${state.detailNoteIndex + 1}/${state.notes.length}</span>
          <span>VECTOR RENDER</span>
        </div>
        <div class="diagram-stage">
          <canvas class="diagram-canvas" id="visualPreviewCanvas" width="560" height="280"></canvas>
        </div>
        <div class="diagram-copy">${escapeHtml(visualCaption(note, visualKind))}</div>
        <div class="screen-footer">Rendered to canvas, converted to gray4 or BMP, then pushed through the image container.</div>
      `;
    }

    return `
      <div class="screen-header">
        <span>NOTE ${state.detailNoteIndex + 1}/${state.notes.length}</span>
        <span>${note.pinned ? 'PINNED' : 'LIVE'}</span>
      </div>
      <div class="detail-copy">
        <h3>${escapeHtml(note.title || 'Untitled')}</h3>
        <pre>${escapeHtml(truncate(detailText(note), 900))}</pre>
      </div>
      <div class="screen-footer">Scroll for next note. Enter or click returns to the list.</div>
    `;
  }

  const pageNotes = currentPageNotes();
  const items = pageNotes
    .map((note, index) => {
      const selected = index === state.selectedIndex ? 'preview-row is-selected' : 'preview-row';
      const updated = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(note.updated_at));

      return `
        <li class="${selected}">
          <span class="preview-row-title">${escapeHtml(note.pinned ? `* ${note.title}` : note.title)}</span>
          <span class="preview-row-time">${updated}</span>
        </li>
      `;
    })
    .join('');

  return `
    <div class="screen-header">
      <span>EVEN NOTES</span>
      <span>PAGE ${state.listPage + 1}/${pageCount()}</span>
    </div>
    <ol class="preview-list">${items}</ol>
    <div class="screen-footer">Use Arrow keys in the browser preview. The glasses use list/text events.</div>
  `;
}

export function renderApp() {
  const activeNote = selectedPreviewNote();
  const logs = state.logs.map((entry) => `<li>${escapeHtml(entry)}</li>`).join('');

  app!.innerHTML = `
    <div class="shell">
      <section class="hero">
        <div>
          <p class="eyebrow">Even Hub SDK</p>
          <h1>Even Notes G2 Runtime</h1>
          <p class="lede">This browser view mirrors the container-based layout that is now pushed to the glasses firmware through the Even Hub SDK.</p>
        </div>
        <div class="status-grid">
          <div class="status-card">
            <span class="status-label">Bridge</span>
            <strong>${state.bridgeConnected ? 'Connected' : 'Preview only'}</strong>
          </div>
          <div class="status-card">
            <span class="status-label">WebSocket</span>
            <strong>${state.wsConnected ? 'Live sync' : 'Reconnecting'}</strong>
          </div>
          <div class="status-card">
            <span class="status-label">View</span>
            <strong>${state.view === 'detail' ? 'Detail page' : 'List page'}</strong>
          </div>
          <div class="status-card">
            <span class="status-label">Notes</span>
            <strong>${state.notes.length}</strong>
          </div>
        </div>
      </section>

      <section class="workspace">
        <article class="panel panel-screen">
          <div class="panel-heading">
            <h2>Glasses preview</h2>
            <span>${state.bridgeConnected ? 'SDK containers live' : 'Keyboard/browser preview'}</span>
          </div>
          <div class="screen-shell">
            <div class="screen">${renderPreviewScreen()}</div>
          </div>
        </article>

        <article class="panel panel-runtime">
          <div class="panel-heading">
            <h2>Runtime</h2>
            <span>${activeNote ? escapeHtml(activeNote.title || 'Untitled') : 'No active note'}</span>
          </div>
          <div class="runtime-block">
            <p class="runtime-title">Current route</p>
            <code>${escapeHtml(location.href)}</code>
          </div>
          <div class="runtime-block">
            <p class="runtime-title">Controls</p>
            <p>Browser preview: Arrow Up/Down moves, Enter opens or returns, Escape returns to the list.</p>
            <p>Glasses runtime: Scroll events change selection or note, click opens the note or returns.</p>
          </div>
          <div class="runtime-block">
            <p class="runtime-title">Recent logs</p>
            <ul class="log-list">${logs || '<li>No runtime events yet.</li>'}</ul>
          </div>
        </article>
      </section>
    </div>
  `;

  void paintVisualPreview(activeNote);
}

export async function paintVisualPreview(note: Note | null) {
  if (!note) {
    return;
  }

  const visualKind = getVisualKind(note);
  if (!visualKind) {
    return;
  }

  const canvas = document.querySelector<HTMLCanvasElement>('#visualPreviewCanvas');
  if (!canvas) {
    return;
  }

  if (visualKind.type === 'diagram') {
    drawDiagram(visualKind.kind, canvas);
    return;
  }

  try {
    const image = await loadImageElement(visualKind.image.dataUrl);
    drawAttachmentImage(image, canvas);
  } catch (error) {
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#15120e';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#b0f0ca';
    context.font = '16px "IBM Plex Mono", monospace';
    context.fillText('Image preview failed', 24, 48);
    context.font = '12px "IBM Plex Mono", monospace';
    context.fillText(error instanceof Error ? truncate(error.message, 48) : 'Unknown image error', 24, 78);
  }
}
