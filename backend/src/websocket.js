const { WebSocketServer } = require('ws');
const store = require('./notes-store');

const clients = new Set();
let wsServer = null;

function broadcastNotes() {
  const payload = JSON.stringify({ type: 'notes', data: store.getAll() });
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

function attachWebSocketServer(server) {
  if (wsServer) return;

  wsServer = new WebSocketServer({ server });

  wsServer.on('connection', (ws, req) => {
    console.log(`[WS] Client connected from ${req.socket.remoteAddress}`);
    clients.add(ws);

    ws.send(JSON.stringify({ type: 'notes', data: store.getAll() }));

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WS] Client disconnected');
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
      clients.delete(ws);
    });
  });

  wsServer.on('error', (err) => {
    console.error('[WS] Server error:', err.message);
  });
}

module.exports = { broadcastNotes, attachWebSocketServer };
