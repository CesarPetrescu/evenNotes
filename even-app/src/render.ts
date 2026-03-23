import type { Note } from './types';
import { state, app, NOTES_PER_PAGE } from './state';
import { currentMenuOptions } from './glasses';
import { truncate, singleLine, escapeHtml } from './utils';
import { getDiagramKind, drawDiagram, FULL_W, FULL_H } from './images';

// ── Logging ──

export function log(message: string) {
  const ts = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  state.logs.push(`${ts} ${message}`);
  renderApp();
}

function copyLogs() {
  const text = state.logs.join('\n');
  if (navigator.clipboard) {
    void navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

(window as unknown as Record<string, unknown>).__copyLogs = copyLogs;

// ── Preview rendering ──

function pageCount() {
  return Math.max(1, Math.ceil(state.notes.length / NOTES_PER_PAGE));
}

function currentPageNotes() {
  const start = state.listPage * NOTES_PER_PAGE;
  return state.notes.slice(start, start + NOTES_PER_PAGE);
}

function selectedNote(): Note | null {
  if (state.notes.length === 0) return null;
  if (state.view === 'detail' || state.view === 'menu' || state.view === 'image') return state.notes[state.detailIndex];
  return currentPageNotes()[state.selectedIndex] ?? null;
}

function viewLabel() {
  if (state.view === 'image') return 'Image';
  if (state.view === 'menu') return 'Menu';
  if (state.view === 'detail') return 'Detail';
  return 'List';
}

function renderScreen() {
  if (state.notes.length === 0) {
    return `
      <div class="screen-header"><span>EVEN NOTES</span><span>WAITING</span></div>
      <div class="screen-empty"><p>No notes yet.</p><p>Create one from /admin.</p></div>`;
  }

  // ── Menu view ──
  if (state.view === 'menu') {
    const note = state.notes[state.detailIndex];
    const options = currentMenuOptions();
    const items = options.map((o, i) => {
      const cls = i === state.menuDefault ? 'preview-row is-selected' : 'preview-row';
      return `<li class="${cls}"><span class="preview-row-title">${escapeHtml(o.label)}</span></li>`;
    }).join('');

    return `
      <div class="screen-header">
        <span>ACTIONS</span>
        <span>NOTE ${state.detailIndex + 1}/${state.notes.length}</span>
      </div>
      <div class="detail-copy" style="min-height:auto;margin-bottom:8px">
        <h3>${escapeHtml(singleLine(note.title || 'Untitled'))}</h3>
      </div>
      <ol class="preview-list">${items}</ol>
      <div class="screen-footer">Scroll to choose. Click to select.</div>`;
  }

  // ── Image view ──
  if (state.view === 'image') {
    const note = state.notes[state.detailIndex];
    const diag = getDiagramKind(note.title);
    const caption = diag
      ? `Diagram: ${diag}`
      : note.image?.kind === 'drawing' ? 'Sketch note' : 'Image note';
    return `
      <div class="screen-header">
        <span>NOTE ${state.detailIndex + 1}/${state.notes.length}</span>
        <span>IMAGE VIEW</span>
      </div>
      <div class="diagram-stage">
        <canvas class="diagram-canvas" id="previewCanvas" width="${FULL_W}" height="${FULL_H}" style="aspect-ratio:${FULL_W}/${FULL_H}"></canvas>
      </div>
      <div class="diagram-copy">${escapeHtml(caption)} (${FULL_W}x${FULL_H} tiled across 3 containers)</div>
      <div class="screen-footer">Click to go back to note text.</div>`;
  }

  // ── Detail view (always text) ──
  if (state.view === 'detail') {
    const note = state.notes[state.detailIndex];
    const hasImage = getDiagramKind(note.title) || note.image?.dataUrl;
    const body = note.content.trim() || '(empty)';
    return `
      <div class="screen-header">
        <span>NOTE ${state.detailIndex + 1}/${state.notes.length}</span>
        <span>${note.pinned ? 'PINNED' : 'LIVE'}</span>
      </div>
      <div class="detail-copy">
        <h3>${escapeHtml(note.title || 'Untitled')}</h3>
        <pre>${escapeHtml(truncate(body, 900))}</pre>
      </div>
      <div class="screen-footer">Click for actions.${hasImage ? ' Has image.' : ''}</div>`;
  }

  // ── List view ──
  const notes = currentPageNotes();
  const items = notes.map((n, i) => {
    const cls = i === state.selectedIndex ? 'preview-row is-selected' : 'preview-row';
    const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(n.updated_at));
    return `<li class="${cls}">
      <span class="preview-row-title">${escapeHtml(n.pinned ? `* ${n.title}` : n.title)}</span>
      <span class="preview-row-time">${time}</span>
    </li>`;
  }).join('');

  return `
    <div class="screen-header"><span>EVEN NOTES</span><span>PAGE ${state.listPage + 1}/${pageCount()}</span></div>
    <ol class="preview-list">${items}</ol>
    <div class="screen-footer">Scroll to browse. Click to open note.</div>`;
}

export function renderApp() {
  const active = selectedNote();
  const logHtml = state.logs.map((e) => `<li>${escapeHtml(e)}</li>`).join('');

  app.innerHTML = `
    <div class="shell">
      <section class="hero">
        <div>
          <p class="eyebrow">Even Hub SDK</p>
          <h1>Even Notes G2</h1>
          <p class="lede">Browser mirror of the glasses display. Notes sync live via WebSocket.</p>
        </div>
        <div class="status-grid">
          <div class="status-card"><span class="status-label">Bridge</span><strong>${state.bridgeReady ? 'Connected' : 'Preview'}</strong></div>
          <div class="status-card"><span class="status-label">WebSocket</span><strong>${state.wsConnected ? 'Live' : 'Reconnecting'}</strong></div>
          <div class="status-card"><span class="status-label">View</span><strong>${viewLabel()}</strong></div>
          <div class="status-card"><span class="status-label">Notes</span><strong>${state.notes.length}</strong></div>
        </div>
      </section>

      <section class="workspace">
        <article class="panel panel-screen">
          <div class="panel-heading"><h2>Glasses preview</h2><span>${state.bridgeReady ? 'Live' : 'Preview'}</span></div>
          <div class="screen-shell"><div class="screen">${renderScreen()}</div></div>
        </article>

        <article class="panel panel-runtime">
          <div class="panel-heading"><h2>Runtime</h2><span>${active ? escapeHtml(singleLine(active.title || 'Untitled')) : 'No note'}</span></div>
          <div class="runtime-block">
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:8px">
              <p class="runtime-title" style="margin:0">Logs (${state.logs.length})</p>
              <button onclick="window.__copyLogs()" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(118,247,197,0.24);background:rgba(118,247,197,0.08);color:var(--accent);cursor:pointer;font:inherit;font-size:0.78rem">Copy all</button>
            </div>
            <ul class="log-list" style="max-height:600px;overflow-y:auto">${logHtml || '<li>Waiting for events...</li>'}</ul>
          </div>
        </article>
      </section>
    </div>`;

  const logEl = document.querySelector('.log-list');
  if (logEl) logEl.scrollTop = logEl.scrollHeight;

  void paintPreview(active);
}

async function paintPreview(note: Note | null) {
  if (!note) return;
  const canvas = document.querySelector<HTMLCanvasElement>('#previewCanvas');
  if (!canvas) return;

  const diag = getDiagramKind(note.title);
  if (diag) { drawDiagram(diag, canvas); return; }

  if (note.image?.dataUrl) {
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load failed'));
        img.src = note.image!.dataUrl;
      });
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#010504';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    } catch {
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#15120e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#b0f0ca'; ctx.font = '16px monospace';
      ctx.fillText('Image preview failed', 24, 48);
    }
  }
}
