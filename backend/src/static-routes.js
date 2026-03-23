const express = require('express');
const path = require('path');

const backendDir = path.join(__dirname, '..');

function mountStaticRoutes(app) {
  app.use('/admin', express.static(path.join(backendDir, 'public')));
  app.get('/admin', (req, res) => {
    res.sendFile(path.join(backendDir, 'public', 'index.html'));
  });

  const glassesDistDir = path.join(backendDir, '..', 'even-app', 'dist');
  const glassesStaticOptions = {
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }
  };

  app.get(/^\/glasses$/, (req, res) => {
    res.redirect('/glasses/');
  });
  app.use('/glasses', express.static(glassesDistDir, glassesStaticOptions));

  app.get(/^\/glasses-dev$/, (req, res) => {
    res.redirect('/glasses-dev/');
  });
  app.use('/glasses-dev', express.static(glassesDistDir, glassesStaticOptions));
}

module.exports = { mountStaticRoutes };
