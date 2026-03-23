    const API = window.location.origin;
    const MAX_MEDIA_EDGE = 1200;
    let notes = [];
    let ws = null;
    let editingId = null;
    let editDraftImage = null;
    let composerImage = null;
    let isDrawing = false;
    let drawingDirty = false;
    let lastDrawPoint = null;

    function connectWS() {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${location.host}`);

      ws.onopen = () => {
        document.getElementById('statusDot').classList.remove('disconnected');
        document.getElementById('statusText').textContent = 'Live sync on';
        document.getElementById('wsInfo').textContent = 'Connected to the backend';
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'notes') {
          notes = normalizeIncomingNotes(msg.data);
          renderNotes();
          renderGlassesPreview();
        }
      };

      ws.onclose = () => {
        document.getElementById('statusDot').classList.add('disconnected');
        document.getElementById('statusText').textContent = 'Reconnecting';
        document.getElementById('wsInfo').textContent = 'Trying to restore the live link';
        setTimeout(connectWS, 2000);
      };

      ws.onerror = () => ws.close();
    }

    function normalizeIncomingNotes(input) {
      return Array.isArray(input)
        ? input.map(note => ({
          ...note,
          image: note.image ?? null
        }))
        : [];
    }

    function sortedNotes() {
      return [...notes].sort((a, b) => {
        if (a.pinned !== b.pinned) {
          return Number(b.pinned) - Number(a.pinned);
        }

        return new Date(b.updated_at) - new Date(a.updated_at);
      });
    }

    function formatTime(value) {
      return new Date(value).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    function escHtml(value) {
      const div = document.createElement('div');
      div.textContent = value || '';
      return div.innerHTML;
    }

    function escAttr(value) {
      return escHtml(value).replaceAll('"', '&quot;');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }

    async function apiRequest(path, options = {}) {
      const response = await fetch(`${API}${path}`, options);
      const raw = await response.text();
      let data = null;

      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
      }

      if (!response.ok) {
        const message = data && typeof data === 'object' && typeof data.error === 'string'
          ? data.error
          : `Request failed (${response.status})`;
        throw new Error(message);
      }

      return data;
    }

    function loadImageFromUrl(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image decode failed'));
        image.src = url;
      });
    }

    async function fileToNoteImage(file) {
      const objectUrl = URL.createObjectURL(file);

      try {
        const image = await loadImageFromUrl(objectUrl);
        const scale = Math.min(1, MAX_MEDIA_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas 2D context unavailable');
        }

        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const mimeType = file.type === 'image/png'
          ? 'image/png'
          : file.type === 'image/jpeg'
            ? 'image/jpeg'
            : 'image/webp';
        const dataUrl = mimeType === 'image/png'
          ? canvas.toDataURL(mimeType)
          : canvas.toDataURL(mimeType, 0.92);

        return {
          kind: 'upload',
          mimeType,
          dataUrl,
          width,
          height
        };
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    function drawingPadToNoteImage() {
      const { canvas } = getDrawContext();
      return {
        kind: 'drawing',
        mimeType: 'image/png',
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height
      };
    }

    function getDrawContext() {
      const canvas = document.getElementById('drawCanvas');
      const context = canvas.getContext('2d');
      return { canvas, context };
    }

    function clearDrawingPad() {
      const { canvas, context } = getDrawContext();
      context.fillStyle = '#fffdf8';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = 'rgba(56, 36, 18, 0.07)';
      context.lineWidth = 1;

      for (let x = 0; x <= canvas.width; x += 80) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }

      for (let y = 0; y <= canvas.height; y += 80) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }

      drawingDirty = false;
    }

    function pointerPoint(event, canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
      };
    }

    function drawStroke(from, to) {
      const { context } = getDrawContext();
      context.strokeStyle = '#1c130b';
      context.lineWidth = 10;
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.stroke();
    }

    function setupDrawingPad() {
      const { canvas } = getDrawContext();
      clearDrawingPad();

      canvas.addEventListener('pointerdown', (event) => {
        isDrawing = true;
        lastDrawPoint = pointerPoint(event, canvas);
        drawStroke(lastDrawPoint, lastDrawPoint);
        drawingDirty = true;
        canvas.setPointerCapture(event.pointerId);
      });

      canvas.addEventListener('pointermove', (event) => {
        if (!isDrawing || !lastDrawPoint) {
          return;
        }

        const nextPoint = pointerPoint(event, canvas);
        drawStroke(lastDrawPoint, nextPoint);
        lastDrawPoint = nextPoint;
      });

      const finish = () => {
        isDrawing = false;
        lastDrawPoint = null;
      };

      canvas.addEventListener('pointerup', finish);
      canvas.addEventListener('pointercancel', finish);
      canvas.addEventListener('pointerleave', finish);
    }

    function setComposerImage(image) {
      composerImage = image;
      refreshComposerMedia();
    }

    function clearComposerMedia() {
      composerImage = null;
      document.getElementById('composerFile').value = '';
      refreshComposerMedia();
      showToast('Composer media cleared');
    }

    function refreshComposerMedia() {
      const preview = document.getElementById('composerMediaPreview');
      const badge = document.getElementById('mediaBadge');
      const mode = document.getElementById('mediaMode');

      if (!composerImage) {
        badge.textContent = 'Text only';
        mode.textContent = 'Text only';
        preview.innerHTML = '<div class="media-empty">No image attached yet. Upload a PNG/JPG/WEBP or turn the sketch pad into a note image.</div>';
        return;
      }

      const label = composerImage.kind === 'drawing' ? 'Sketch attached' : 'Image attached';
      badge.textContent = label;
      mode.textContent = label;
      preview.innerHTML = `<img src="${escAttr(composerImage.dataUrl)}" alt="Composer media preview" />`;
    }

    function triggerComposerFile() {
      document.getElementById('composerFile').click();
    }

    async function handleComposerFileChange(event) {
      const [file] = event.target.files || [];
      if (!file) {
        return;
      }

      try {
        const image = await fileToNoteImage(file);
        setComposerImage(image);
        showToast('Image attached to composer');
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    function useDrawingForComposer() {
      if (!drawingDirty) {
        showToast('Draw something first');
        return;
      }

      setComposerImage(drawingPadToNoteImage());
      showToast('Sketch attached to composer');
    }

    async function addNote() {
      const title = document.getElementById('newTitle').value.trim();
      const content = document.getElementById('newContent').value.trim();
      if (!title && !content && !composerImage) {
        return;
      }

      try {
        await apiRequest('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || 'Untitled',
            content,
            image: composerImage
          })
        });

        document.getElementById('newTitle').value = '';
        document.getElementById('newContent').value = '';
        document.getElementById('newTitle').focus();
        composerImage = null;
        document.getElementById('composerFile').value = '';
        refreshComposerMedia();
        clearDrawingPad();
        showToast('Note added');
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    async function deleteNote(id) {
      try {
        await apiRequest(`/api/notes/${id}`, { method: 'DELETE' });
        showToast('Note deleted');
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    async function togglePin(id) {
      try {
        await apiRequest(`/api/notes/${id}/pin`, { method: 'POST' });
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    function startEdit(id) {
      const note = notes.find((entry) => entry.id === id);
      editingId = id;
      editDraftImage = note?.image ?? null;
      renderNotes();
      const card = document.querySelector(`[data-id="${id}"]`);
      if (card) card.querySelector('.note-title-input')?.focus();
    }

    function cancelEdit() {
      editingId = null;
      editDraftImage = null;
      renderNotes();
    }

    function triggerEditFile(id) {
      const input = document.getElementById(`editFile-${id}`);
      if (input) input.click();
    }

    async function handleEditFileChange(event, id) {
      const [file] = event.target.files || [];
      if (!file || editingId !== id) {
        return;
      }

      try {
        editDraftImage = await fileToNoteImage(file);
        renderNotes();
        showToast('Note image updated in draft');
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    function removeEditImage() {
      editDraftImage = null;
      renderNotes();
    }

    function useDrawingForEdit() {
      if (!editingId) {
        return;
      }

      if (!drawingDirty) {
        showToast('Draw something first');
        return;
      }

      editDraftImage = drawingPadToNoteImage();
      renderNotes();
      showToast('Sketch attached to edit draft');
    }

    async function saveEdit(id) {
      const card = document.querySelector(`[data-id="${id}"]`);
      const title = card.querySelector('.note-title-input').value.trim();
      const content = card.querySelector('.note-content-input').value.trim();

      try {
        await apiRequest(`/api/notes/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            content,
            image: editDraftImage
          })
        });

        editingId = null;
        editDraftImage = null;
        showToast('Note updated');
      } catch (error) {
        showToast(error instanceof Error ? error.message : String(error));
      }
    }

    function renderNotes() {
      const list = document.getElementById('notesList');
      const count = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
      document.getElementById('noteCount').textContent = count;
      document.getElementById('notesBadge').textContent = `${notes.length} item${notes.length !== 1 ? 's' : ''}`;

      if (notes.length === 0) {
        list.innerHTML = '<div class="empty-state">No notes yet. Add one above and it will show up on your glasses list.</div>';
        return;
      }

      list.innerHTML = sortedNotes().map((note) => {
        const isEditing = editingId === note.id;
        const time = formatTime(note.updated_at);
        const currentImage = isEditing ? editDraftImage : note.image;

        if (isEditing) {
          return `
            <div class="note-card editing" data-id="${note.id}">
              <div class="field">
                <label>Title</label>
                <input class="note-title-input" value="${escHtml(note.title)}" />
              </div>
              <div class="field" style="margin-top:10px">
                <label>Body</label>
                <textarea class="note-content-input" rows="4">${escHtml(note.content)}</textarea>
              </div>
              <div class="edit-media">
                <input class="hidden-input" id="editFile-${note.id}" type="file" accept="image/png,image/jpeg,image/webp" onchange="handleEditFileChange(event, '${note.id}')" />
                ${currentImage ? `<img src="${escAttr(currentImage.dataUrl)}" alt="Edit media preview" />` : '<div class="media-empty">No image attached to this note.</div>'}
                <div class="edit-media-actions" style="margin-top:10px">
                  <button class="btn" type="button" onclick="triggerEditFile('${note.id}')">Replace image</button>
                  <button class="btn" type="button" onclick="useDrawingForEdit()">Use current sketch</button>
                  <button class="btn btn-danger" type="button" onclick="removeEditImage()">Remove image</button>
                </div>
              </div>
              <div class="note-meta">
                <span class="note-time">${time}</span>
                <div class="note-actions">
                  <button class="btn" onclick="cancelEdit()">Cancel</button>
                  <button class="btn btn-primary" onclick="saveEdit('${note.id}')">Save</button>
                </div>
              </div>
            </div>`;
        }

        return `
          <div class="note-card ${note.pinned ? 'pinned' : ''}" data-id="${note.id}">
            <div class="note-top">
              <div class="note-title">${escHtml(note.title)}</div>
              <button class="btn btn-pin ${note.pinned ? 'active' : ''}" onclick="togglePin('${note.id}')" title="${note.pinned ? 'Unpin note' : 'Pin note'}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${note.pinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M12 2l2.09 6.26L21 9.27l-5 4.87L17.18 21 12 17.27 6.82 21 8 14.14 3 9.27l6.91-1.01z"/></svg>
              </button>
            </div>
            ${note.content ? `<div class="note-content">${escHtml(note.content)}</div>` : ''}
            ${note.image ? `<span class="media-chip">${note.image.kind === 'drawing' ? 'Sketch note' : 'Image note'}</span>` : ''}
            ${note.image ? `<img class="note-media" src="${escAttr(note.image.dataUrl)}" alt="Note media" />` : ''}
            <div class="note-meta">
              <span class="note-time">${time}</span>
              <div class="note-actions">
                <button class="btn" onclick="startEdit('${note.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteNote('${note.id}')">Delete</button>
              </div>
            </div>
          </div>`;
      }).join('');
    }

    function renderGlassesPreview() {
      const el = document.getElementById('glassesPreview');
      if (notes.length === 0) {
        el.textContent = 'No notes yet. The glasses view is empty.';
        return;
      }

      const lines = sortedNotes().map((note, index) => {
        const prefix = note.pinned ? '★' : '·';
        const media = note.image ? (note.image.kind === 'drawing' ? ' [sketch]' : ' [img]') : '';
        const title = (note.title || 'Untitled').substring(0, 34);
        const body = note.content
          ? `\n   ${(note.content || '').substring(0, 54).replace(/\n/g, ' ')}`
          : note.image
            ? '\n   image will render in detail mode'
            : '';
        return `${prefix} ${index + 1}. ${title}${media}${body}`;
      });

      el.textContent = lines.join('\n\n');
    }

    document.getElementById('composerFile').addEventListener('change', handleComposerFileChange);

    document.getElementById('newContent').addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) addNote();
    });

    document.getElementById('newTitle').addEventListener('keydown', (event) => {
      if (event.key === 'Enter') document.getElementById('newContent').focus();
    });

    setupDrawingPad();
    refreshComposerMedia();
    connectWS();
    apiRequest('/api/notes')
      .then((data) => {
        notes = normalizeIncomingNotes(data);
        renderNotes();
        renderGlassesPreview();
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : String(error));
      });
