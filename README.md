# Even Notes

Real-time notes for Even G2 smart glasses.

Even Notes is a small end-to-end prototype for writing notes in a browser and seeing them update live on Even G2 glasses. It supports plain text notes, uploaded images, and quick sketches, then pushes the latest note list to the glasses runtime over WebSocket.

## What It Includes

- A Node.js + Express backend
- A phone/admin web UI for writing and managing notes
- A TypeScript Even Hub app for the glasses

## What You Can Do

- Create, edit, pin, and delete notes from the browser
- Attach uploaded PNG, JPEG, or WEBP images
- Draw sketches in the admin UI and save them as note media
- Sync the full note list to the glasses in real time
- Browse notes on the glasses in list and detail views
- Preview the glasses runtime in a normal browser
- Fall back to text mode if image rendering fails on-device

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

### Runtime flow

1. A note is created or updated in the admin UI.
2. The backend updates its in-memory `notes` array.
3. The backend broadcasts the full note list over WebSocket.
4. The glasses app receives, normalizes, and sorts the list.
5. The active glasses page is rebuilt through the Even Hub SDK.
6. If the note has visual content, the runtime uploads image data to the device container.

## Stack

- Backend: Node.js, Express, `ws`, `uuid`, `dotenv`
- Admin UI: HTML, CSS, vanilla JavaScript
- Glasses app: TypeScript, Vite, `@evenrealities/even_hub_sdk`

## Project Structure

```text
backend/
├── package.json
├── server.js
├── public/
│   ├── index.html
│   ├── admin.css
│   └── admin.js
└── src/
    ├── config.js
    ├── notes-store.js
    ├── routes.js
    ├── startup.js
    ├── static-routes.js
    ├── template-notes.js
    ├── validators.js
    └── websocket.js

even-app/
├── app.json
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── glasses.ts
    ├── images.ts
    ├── main.ts
    ├── render.ts
    ├── state.ts
    ├── styles.css
    ├── types.ts
    ├── utils.ts
    └── websocket.ts
```

## Quick Start

### Prerequisites

- Node.js and npm
- Even G2 glasses if you want to test on hardware
- Phone and dev machine on the same network for local device loading

### Install

From the backend directory:

```bash
cd backend
npm install
```

`backend/package.json` runs a `postinstall` that also installs the glasses app dependencies in `../even-app`.

### Run

```bash
cd backend
npm run dev
```

This will:

1. Build the glasses app.
2. Start the backend server.

On startup the server prints:

- The admin URL
- The glasses URL
- The WebSocket URL
- A suggested QR command for loading the glasses app

## Routes

### App routes

- `GET /admin` for the admin dashboard
- `GET /glasses/` for the built glasses runtime
- `GET /glasses-dev/` for the same built glasses output

### API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/notes` | Return all notes |
| `POST` | `/api/notes` | Create a note |
| `PUT` | `/api/notes/:id` | Update a note |
| `DELETE` | `/api/notes/:id` | Delete a note |
| `POST` | `/api/notes/:id/pin` | Toggle pinned state |

### WebSocket

Clients connect to the same server host over WebSocket and receive messages shaped like:

```json
{ "type": "notes", "data": [...] }
```

The app always broadcasts the full note array. It does not use diff-based sync.

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

## Important Constraints

- Notes are stored in memory only
- Restarting the backend resets the data
- The server starts with seeded template notes
- Images are stored as data URLs inside note objects
- Accepted image MIME types are `image/png`, `image/jpeg`, and `image/webp`

## Why This Project Is Interesting

This project is a compact example of:

- A real-time browser-to-device sync loop
- Wearable UI constraints and fallback rendering
- Client-side media preprocessing before transport
- A full-stack prototype that is small enough to understand quickly

## Related Docs

- `docs.md` for the longer technical walkthrough
- `PROJECT_ONE_PAGER.md` for the short portfolio-style summary

## Resume Summary

Built a real-time notes platform for Even G2 smart glasses using Node.js, Express, WebSockets, TypeScript, and the Even Hub SDK, with a web dashboard for creating text, image, and sketch notes that sync live to the device.
