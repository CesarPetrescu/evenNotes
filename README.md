# Even Notes

> 📝 Real-time notes for Even G2 smart glasses.

![Status](https://img.shields.io/badge/status-prototype-6b7280?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-43853d?style=flat-square&logo=nodedotjs&logoColor=white)
![Admin UI](https://img.shields.io/badge/admin-Vanilla%20JS-f7df1e?style=flat-square&logo=javascript&logoColor=222)
![Realtime](https://img.shields.io/badge/realtime-WebSocket-0f172a?style=flat-square)
![Glasses App](https://img.shields.io/badge/glasses-TypeScript%20%2B%20Vite-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Device](https://img.shields.io/badge/device-Even%20G2-111827?style=flat-square)

Even Notes is a small end-to-end project for writing notes in a browser and seeing them update live on Even G2 glasses. It includes a Node/Express backend, a phone/admin web UI, and a TypeScript Even Hub runtime for the glasses.

Notes can be:

- Plain text
- Uploaded images
- Quick sketches drawn in the admin UI

The system syncs the full note list over WebSocket so the browser dashboard and glasses runtime stay aligned.

## Table Of Contents

- [At A Glance](#at-a-glance)
- [Features](#features)
- [Architecture](#architecture)
- [How The System Flows](#how-the-system-flows)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Routes And Sync](#routes-and-sync)
- [Data Model](#data-model)
- [Behavior And Constraints](#behavior-and-constraints)
- [Related Docs](#related-docs)
- [Resume Summary](#resume-summary)

## At A Glance

| Area | Details |
| --- | --- |
| Purpose | Send notes from a browser to Even G2 glasses in real time |
| Backend | Node.js, Express, `ws`, `uuid`, `dotenv` |
| Admin UI | HTML, CSS, vanilla JavaScript |
| Glasses App | TypeScript, Vite, `@evenrealities/even_hub_sdk` |
| Sync Model | Full note-list broadcast over WebSocket |
| Storage | In-memory only |
| Media Support | Text, uploaded PNG/JPEG/WEBP images, drawn sketches |
| Runtime Views | List view, detail view, browser preview |

## Features

### Admin UI

- Create, edit, pin, and delete notes
- Attach uploaded images to notes
- Draw sketches on a built-in canvas and save them as note media
- Preview the glasses-side list in the browser
- Reconnect automatically if the WebSocket drops

### Backend

- Serves the admin UI and the glasses runtime from one Express app
- Exposes CRUD-style note routes
- Seeds the app with template notes on startup
- Broadcasts note updates to connected clients over WebSocket
- Tries fallback ports if the requested port is already in use

### Glasses Runtime

- Receives note snapshots over WebSocket
- Sorts notes by pinned state and last update time
- Renders list and detail views for the Even G2 runtime
- Supports both text-only and image-based detail pages
- Falls back to text mode if image rendering fails

## Architecture

```text
Admin UI (/admin)
  -> REST API (/api/notes)
  -> in-memory note store
  -> WebSocket broadcast
  -> glasses runtime (/glasses/)
  -> Even Hub bridge
  -> Even G2 device
```

## How The System Flows

1. A note is created or updated in the admin UI.
2. The backend updates the in-memory `notes` array.
3. The backend broadcasts the full note list over WebSocket.
4. The glasses app receives, normalizes, and sorts the data.
5. The active page is rebuilt through the Even Hub SDK.
6. If the note includes visual content, the runtime uploads image data to the image container.

## Quick Start

### Prerequisites

- Node.js and npm
- Even G2 glasses if you want to test on hardware
- Phone and development machine on the same network for local device loading

### Install

From the backend directory:

```bash
cd backend
npm install
```

The backend `postinstall` also installs the glasses app dependencies in `../even-app`.

### Run

```bash
cd backend
npm run dev
```

This does two things:

1. Builds the glasses app
2. Starts the backend server

On startup the server prints:

- The admin URL
- The glasses URL
- The WebSocket URL
- A suggested `evenhub-cli qr` command for device loading

### Open In The Browser

- `/admin` for the note dashboard
- `/glasses/` for the browser preview / glasses runtime output

## Project Structure

```text
backend/
├── package.json              # backend scripts and dependencies
├── server.js                 # express server entrypoint
├── public/
│   ├── index.html            # admin UI markup
│   ├── admin.css             # admin UI styles
│   └── admin.js              # admin UI logic
└── src/
    ├── config.js             # port/env config
    ├── notes-store.js        # in-memory note storage
    ├── routes.js             # REST API routes
    ├── startup.js            # startup banner and port fallback logic
    ├── static-routes.js      # /admin and /glasses static hosting
    ├── template-notes.js     # seeded notes
    ├── validators.js         # request and payload normalization
    └── websocket.js          # WebSocket server and broadcast logic

even-app/
├── app.json                  # Even app manifest
├── index.html                # Vite entry HTML
├── package.json              # glasses app scripts and deps
├── vite.config.ts            # build config
└── src/
    ├── glasses.ts            # bridge sync and Even G2 page creation
    ├── images.ts             # diagram drawing and image encoding
    ├── main.ts               # runtime entrypoint
    ├── render.ts             # browser-side preview rendering
    ├── state.ts              # shared runtime state
    ├── styles.css            # browser preview styles
    ├── types.ts              # shared types
    ├── utils.ts              # text and note helpers
    └── websocket.ts          # note sync from backend
```

## Routes And Sync

### App Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/admin` | Admin dashboard |
| `GET` | `/glasses/` | Built glasses runtime |
| `GET` | `/glasses-dev/` | Same built output as `/glasses/` |

### API Routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/notes` | Return the full note list |
| `POST` | `/api/notes` | Create a note |
| `PUT` | `/api/notes/:id` | Update title, content, image, or pin state |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `POST` | `/api/notes/:id/pin` | Toggle pinned state |

### WebSocket Messages

Clients connect to the same server host over WebSocket and receive messages shaped like:

```json
{ "type": "notes", "data": [...] }
```

This project does not use diff-based sync. It broadcasts the full note array after each create, update, delete, or pin action.

## Data Model

### Note

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
```

### NoteImage

```ts
type NoteImage = {
  kind: 'upload' | 'drawing';
  mimeType: string;
  dataUrl: string;
  width?: number;
  height?: number;
};
```

### Accepted Media Types

- `image/png`
- `image/jpeg`
- `image/webp`

## Behavior And Constraints

### Storage

- Notes are stored in memory only
- Restarting the server resets all note data
- The app starts with seeded template notes
- There is no database or persistence layer

### Images

- Images are stored as data URLs inside the note object
- Uploaded images are resized in the browser before being sent
- Sketches are generated from the admin canvas and stored as note images
- Invalid or unsupported image payloads are normalized to `null`

### Sorting

Both the admin UI and the glasses app sort notes the same way:

1. Pinned notes first
2. Newer `updated_at` values first

### Port Fallback

Default port order:

1. `PORT` from environment, if set
2. `3212`
3. `3213`
4. `3002`
5. `4321`

If one port is occupied, the server tries the next one.

## Related Docs

- `docs.md` for the longer technical walkthrough
- `PROJECT_ONE_PAGER.md` for the portfolio-style project summary

## Resume Summary

Built a real-time notes platform for Even G2 smart glasses using Node.js, Express, WebSockets, TypeScript, and the Even Hub SDK, with a web dashboard for creating text, image, and sketch notes that sync live to the device.
