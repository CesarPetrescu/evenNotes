# Even Notes

## Real-Time Notes for Even G2 Smart Glasses

### Overview

Even Notes is a full-stack prototype that lets a user create notes on a web dashboard and view them live on Even G2 smart glasses. The system supports text notes, uploaded images, and hand-drawn sketches, then syncs updates in real time to the glasses through the Even Hub SDK.

### Problem

Smart glasses are useful for glanceable information, but authoring and managing that content directly on the device is too limited. I built Even Notes to make the glasses a live secondary display for short-form personal content, controlled from a browser-based interface.

### Solution

I designed a lightweight end-to-end system with three parts:

- A Node.js/Express backend that stores notes and serves the app
- A browser-based admin panel for creating, editing, pinning, deleting, uploading, and drawing notes
- A TypeScript glasses runtime that listens for live updates and renders them on Even G2 using the Even Hub SDK

### Key Features

- Real-time note sync from browser to glasses over WebSocket
- Text, image, and sketch-based note support
- Pinning and sorting for priority notes
- Paginated list view and detail view for glasses navigation
- Canvas-based media preprocessing and image downscaling in the browser
- Graceful fallback from image mode to text mode if rendering fails on device
- Browser preview of the glasses runtime for development and debugging

### Architecture

```text
Admin UI -> REST API -> In-memory note store -> WebSocket broadcast -> Glasses web app -> Even Hub bridge -> Even G2
```

### Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Glasses app: TypeScript, Vite, Even Hub SDK
- Backend: Node.js, Express, WebSocket (`ws`)
- Utilities: `uuid`, `dotenv`, canvas/image processing in-browser

### What I Built

- Implemented the backend API and real-time sync flow
- Built the single-page admin dashboard for note management
- Added image upload and drawing-to-note workflows
- Built the glasses-side runtime with list/detail page generation
- Handled device-specific rendering constraints, event navigation, and image fallback logic

### Outcome

The project demonstrates a complete real-time smart glasses application workflow: author content on the web, sync it instantly through a backend service, and render it in a constrained wearable UI. It shows practical work across frontend, backend, realtime systems, device integration, and UX design for emerging hardware.

### Resume Version

Built a real-time notes platform for Even G2 smart glasses using Node.js, Express, WebSockets, TypeScript, and the Even Hub SDK, with a web dashboard for creating text, image, and sketch notes that sync live to the device.
