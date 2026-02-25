# Architecture Overview

## Core Principle: Local-First

The client is the **primary source of truth**. The server acts only as a relay for broadcasting updates between peers and optionally persisting document snapshots.

## Layered Architecture

### 1. UI Layer (Angular Components)

Standalone Angular 19 components using signals for reactive state. The editor renders a list of blocks, each bound to a Yjs shared type.

**Data flow**: `Yjs observe()` → `signal.set()` → Angular template re-renders

### 2. Document Layer (Yjs Y.Doc)

Each document is a `Y.Doc` containing:

- `meta` (Y.Map) — title, timestamps
- `blockOrder` (Y.Array<string>) — ordered list of block IDs
- `blocks` (Y.Map<Y.Map>) — block data keyed by ID

Each block contains:
- `type` — paragraph, heading, todo, quote, divider
- `content` (Y.Text) — character-level CRDT for text
- `props` (Y.Map) — type-specific properties
- `children` (Y.Array) — nested block IDs (for future nesting)

### 3. Persistence Layer (y-indexeddb)

`IndexeddbPersistence` saves Yjs document updates to IndexedDB. On page load, the document is restored from IndexedDB before any network activity.

### 4. Sync Layer (y-websocket)

`WebsocketProvider` connects to the NestJS server over WebSocket. It implements the Yjs sync protocol:
1. Client sends state vector
2. Server responds with missing updates
3. Ongoing updates are broadcast to all connected peers

### 5. Awareness Layer

Separate from document state. Broadcasts ephemeral data (user name, color, cursor position) to other connected clients. Used for presence indicators.

## Server Architecture

NestJS WebSocket Gateway implements the Yjs sync protocol directly:

- Maintains in-memory `Y.Doc` per document room
- Handles sync message types (step1, step2, update)
- Manages awareness protocol for presence
- Cleans up documents when all clients disconnect

## Multi-tab Support

- `WebsocketProvider` uses `BroadcastChannel` to sync between tabs
- Leader election ensures only one tab maintains the WebSocket connection
- `y-indexeddb` also syncs between tabs via IndexedDB events
