const { createTemplateNotes } = require('./template-notes');
const { createNoteFromInput, normalizeText, normalizeBoolean, normalizeImagePayload } = require('./validators');

let notes = createTemplateNotes();

function getAll() {
  return notes;
}

function add(input) {
  const note = createNoteFromInput(input);
  notes.unshift(note);
  return note;
}

function update(id, body) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return null;

  notes[idx] = {
    ...notes[idx],
    title: body.title !== undefined ? normalizeText(body.title, notes[idx].title) : notes[idx].title,
    content: body.content !== undefined ? normalizeText(body.content, notes[idx].content) : notes[idx].content,
    image: body.image !== undefined ? normalizeImagePayload(body.image) : notes[idx].image,
    pinned: body.pinned !== undefined ? normalizeBoolean(body.pinned, notes[idx].pinned) : notes[idx].pinned,
    updated_at: new Date().toISOString()
  };

  return notes[idx];
}

function remove(id) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return null;
  return notes.splice(idx, 1)[0];
}

function togglePin(id) {
  const idx = notes.findIndex(n => n.id === id);
  if (idx === -1) return null;
  notes[idx].pinned = !notes[idx].pinned;
  notes[idx].updated_at = new Date().toISOString();
  return notes[idx];
}

module.exports = { getAll, add, update, remove, togglePin };
