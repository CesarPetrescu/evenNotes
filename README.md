# evenNotes

Real-time notes for Even G2 smart glasses.

## Overview

evenNotes is a full-stack prototype that lets a user create notes in a browser and view them live on Even G2 smart glasses. Notes can be plain text, uploaded images, or quick sketches drawn in the admin panel.

The project has three parts:

- a Node.js/Express backend
- a browser-based admin dashboard
- a TypeScript Even Hub runtime for the glasses

The codebase is already split into backend modules for startup, routes, validation, note storage, WebSocket sync, and static hosting, plus glasses-side modules for bridge sync, rendering, navigation, image encoding, and diagram generation.

## Features

- Real-time sync from browser to glasses over WebSocket
- Text, image, and sketch note support
- Pinning, editing, and deleting notes
- Paginated list/detail navigation on the glasses
- Browser preview for the glasses runtime
- Image fallback to text mode if device rendering fails

## Tech Stack

- Backend: Node.js, Express, `ws`
- Admin UI: HTML, CSS, vanilla JavaScript
- Glasses runtime: TypeScript, Vite, `@evenrealities/even_hub_sdk`

## Repository Layout

```text
backend/
  package.json
  server.js
  public/
  src/
even-app/
  package.json
  app.json
  vite.config.ts
  src/
docs.md
PROJECT_ONE_PAGER.md
```

## Running Locally

```bash
cd backend
npm install
npm run dev
```

Then open:

- `/admin` for the note dashboard
- `/glasses/` for the browser preview / device runtime

## Resume Summary

Built a real-time notes platform for Even G2 smart glasses using Node.js, Express, WebSockets, TypeScript, and the Even Hub SDK, with a web dashboard for creating text, image, and sketch notes that sync live to the device.
