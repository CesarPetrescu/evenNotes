const express = require('express');
const store = require('./notes-store');
const { broadcastNotes } = require('./websocket');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(store.getAll());
});

router.post('/', (req, res) => {
  const note = store.add(req.body);
  broadcastNotes();
  res.status(201).json(note);
});

router.put('/:id', (req, res) => {
  const note = store.update(req.params.id, req.body);
  if (!note) return res.status(404).json({ error: 'Not found' });
  broadcastNotes();
  res.json(note);
});

router.delete('/:id', (req, res) => {
  const note = store.remove(req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  broadcastNotes();
  res.json(note);
});

router.post('/:id/pin', (req, res) => {
  const note = store.togglePin(req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  broadcastNotes();
  res.json(note);
});

module.exports = router;
