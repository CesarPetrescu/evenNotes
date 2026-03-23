const os = require('os');
const { REQUESTED_PORT, FALLBACK_PORTS } = require('./config');

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

function printBanner(localIP, port) {
  const adminUrl = `http://${localIP}:${port}/admin`;
  const glassesUrl = `http://${localIP}:${port}/glasses/`;
  const wsUrl = `ws://${localIP}:${port}`;

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              EVEN NOTES — Live Notes for G2                 ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║  Admin Panel:  ${adminUrl}`);
  console.log(`║  Glasses App:  ${glassesUrl}`);
  console.log(`║  WebSocket:    ${wsUrl}`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  QR for G2 glasses:');
  console.log(`║  npx @evenrealities/evenhub-cli qr --url ${glassesUrl}`);
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
}

function buildCandidatePorts() {
  return [...new Set([REQUESTED_PORT, ...FALLBACK_PORTS])];
}

function listenOnAvailablePort(server, ports) {
  return new Promise((resolve, reject) => {
    let lastError = null;

    const tryNext = (index) => {
      if (index >= ports.length) {
        reject(lastError || new Error('No available ports found'));
        return;
      }

      const port = ports[index];

      const onError = (err) => {
        server.off('listening', onListening);
        lastError = err;

        if (err.code === 'EADDRINUSE') {
          console.warn(`[server] Port ${port} is busy, trying another port...`);
          tryNext(index + 1);
          return;
        }

        reject(err);
      };

      const onListening = () => {
        server.off('error', onError);
        resolve(port);
      };

      server.once('error', onError);
      server.once('listening', onListening);
      server.listen(port, '0.0.0.0');
    };

    tryNext(0);
  });
}

module.exports = { getLocalIP, printBanner, buildCandidatePorts, listenOnAvailablePort };
