# Even Notes Documentation

## What This Project Is

Even Notes is a small end-to-end notes system for Even G2 glasses.

It has three parts:

1. A Node/Express backend that stores notes in memory and serves both frontends.
2. A phone/admin web UI for creating, editing, pinning, deleting, uploading, and drawing note content.
3. An Even Hub glasses app that receives the note list over WebSocket and renders it into the container-based G2 runtime.

## Repository Layout

```text
even-notes/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── public/
│   └── src/
└── even-app/
    ├── package.json
    ├── app.json
    ├── vite.config.ts
    └── src/
```

## High-Level Architecture

```text
Admin UI (/admin)
  -> REST API (/api/notes)
  -> backend in-memory store
  -> WebSocket broadcast
  -> glasses runtime (/glasses/)
  -> Even Hub bridge
  -> Even G2 device
```

## Main Flow

1. A note is created or edited in the admin UI.
2. The backend updates the in-memory `notes` array.
3. The backend broadcasts the full note list over WebSocket.
4. The glasses app receives the new list, normalizes and sorts it.
5. The glasses app rebuilds the active G2 page through the Even Hub SDK.
6. If the note contains renderable media, the app pushes image bytes to the image container.

## Feature Summary

### Backend

- Stores notes in memory only
- Seeds example notes on startup
- Exposes CRUD-style REST endpoints
- Broadcasts full note snapshots over WebSocket
- Serves both `/admin` and `/glasses`
- Chooses an available port automatically if the requested one is busy
- Is split into startup, route, websocket, validation, note-store, and static-route modules

### Admin UI

- Plain HTML/CSS/JS, no framework
- Create text notes
- Upload PNG/JPEG/WEBP images
- Draw sketches on a built-in canvas and attach them as note images
- Edit notes, replace/remove attached media, pin/unpin, delete
- Shows a simple text preview of the glasses list
- Reconnects automatically if the WebSocket drops
- Is served from split static assets instead of a single inline script block

### Glasses Runtime

- Built with Vite + TypeScript
- Uses `@evenrealities/even_hub_sdk`
- Maintains a paginated list view and a detail view
- Supports six notes per page in list mode
- Renders text-only detail pages or image/detail pages depending on note content
- Supports keyboard navigation in the browser preview and event-based navigation on real glasses
- Falls back to text detail mode if image rendering or upload fails
- Is split into bridge, rendering, navigation, diagram, image-encoding, and utility modules

## Running The Project

### Prerequisites

- Node.js and npm
- An Even G2 setup if you want to run on hardware
- Phone and development machine on the same network for local testing

### Install

```bash
cd backend
npm install
```

### Start

```bash
npm run dev
```

## Routes

### User-facing routes

- `GET /admin`
- `GET /glasses/`
- `GET /glasses-dev/`

### API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/notes` | Return the full note list |
| `POST` | `/api/notes` | Create a new note |
| `PUT` | `/api/notes/:id` | Update title, content, image, or pin state |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `POST` | `/api/notes/:id/pin` | Toggle pinned state |

## Data Model

```ts
type Note = {
  id: string;
  title: string;
  content: string;
  image: NoteImage | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type NoteImage = {
  kind: 'upload' | 'drawing';
  mimeType: string;
  dataUrl: string;
  width?: number;
  height?: number;
};
```

## Current Limitations

- No database or file persistence
- No authentication
- Full-array WebSocket sync only
- Large images are stored inline as base64 data URLs
- The admin UI still ships as static browser assets without a framework
- The project is modular now, but it is still a prototype architecture
- `/glasses-dev/` is not a separate development path right now
- There is no automated test suite
