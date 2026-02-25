# AGENTS.md

## Project

Local-First Notion Lite — block-based document editor with CRDT synchronization.
- **Client**: `apps/client/` — Angular 19 standalone, signals, no NgModules
- **Server**: `apps/server/` — NestJS, WebSocket Gateway
- **Shared types**: `libs/shared/src/` — imported as `@local-first/shared`

## Commands

```bash
npm install          # install all workspaces
npm run dev          # start client (:4200) + server (:3000) concurrently
npm run client       # Angular dev server only
npm run server       # NestJS dev server only
npm run build:client
npm run build:server
```

## Architecture

**Local-first principle**: `IndexedDB` is the primary data store. Server is a relay only.

**CRDT model** (Yjs, `Y.Doc` per document):
- `meta` → `Y.Map` (title, timestamps)
- `blockOrder` → `Y.Array<string>` (ordered block IDs)
- `blocks` → `Y.Map<Y.Map>` keyed by block ID, each containing:
  - `type` → plain value
  - `content` → `Y.Text`
  - `props` → `Y.Map`
  - `children` → `Y.Array<string>`

**Client service layer** (`apps/client/src/app/core/services/`):
- `DocumentService` — Y.Doc lifecycle, block CRUD, UndoManager
- `PersistenceService` — y-indexeddb wrapper
- `SyncService` — WebsocketProvider (y-websocket), includes BroadcastChannel for multi-tab
- `AwarenessService` — presence (name, color, cursor)
- `ConnectionService` — online/offline state + Simulate Offline

## Conventions

- **Angular**: standalone components only, use `signal()` / `computed()` for reactive state; never use `BehaviorSubject` for UI state
- **Yjs mutations**: always wrap in `ydoc.transact()` to batch changes and avoid intermediate states
- **Observers → Signals**: `yArray.observe(() => signal.set([...yArray]))` — do not call `signal.set()` outside NgZone if using zone-based change detection
- **Server Gateway**: `SyncGateway` handles raw Yjs sync protocol messages (types 0 = sync, 1 = awareness); do not add application logic here
- **No server state**: the server holds in-memory `Y.Doc` only while clients are connected; do not add a database without updating ADR-002

## Key Files

| File | Purpose |
|------|---------|
| `apps/client/src/app/core/services/document.service.ts` | Central CRDT API for UI |
| `apps/server/src/sync/sync.gateway.ts` | Yjs sync + awareness protocol |
| `libs/shared/src/types/block.types.ts` | `BlockType` enum and defaults |
| `docs/adr/` | Architecture Decision Records |
