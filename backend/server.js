const express = require('express');
const http = require('http');
const cors = require('cors');
const notesRouter = require('./src/routes');
const { mountStaticRoutes } = require('./src/static-routes');
const { attachWebSocketServer } = require('./src/websocket');
const { getLocalIP, printBanner, buildCandidatePorts, listenOnAvailablePort } = require('./src/startup');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/api/notes', notesRouter);
mountStaticRoutes(app);

listenOnAvailablePort(server, buildCandidatePorts())
  .then((port) => {
    attachWebSocketServer(server);
    printBanner(getLocalIP(), port);
  })
  .catch((err) => {
    console.error(`[server] Failed to start: ${err.message}`);
    process.exit(1);
  });
