# Local-First Notion Lite

A block-based document editor demonstrating **local-first architecture** with CRDT-based synchronization, full offline support, and real-time multi-client collaboration.

> Built as a portfolio-grade educational project to demonstrate deep understanding of local-first systems, optimistic replication, and eventual consistency.

---

## Key Concepts Demonstrated

| Principle | Implementation |
|---|---|
| **Offline-parity** | IndexedDB as primary data store; app works fully without network |
| **CRDT-based state** | Yjs `Y.Doc` with `Y.Text`, `Y.Map`, `Y.Array` for conflict-free editing |
| **Optimistic updates** | UI updates immediately via local Yjs transactions, no server roundtrip |
| **Eventual consistency** | Background sync merges divergent states automatically upon reconnect |
| **Multi-client collaboration** | WebSocket relay broadcasts CRDT updates to all connected peers |
| **Multi-tab editing** | BroadcastChannel syncs between tabs; leader election for WebSocket |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Angular Client                  │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ UI Layer │──│ Document  │──│  Persistence  │  │
│  │Components│  │  Layer    │  │  (IndexedDB)  │  │
│  └──────────┘  │ (Yjs Doc)│  └───────────────┘  │
│                └────┬─────┘                      │
│                     │                            │
│              ┌──────┴──────┐                     │
│              │  Sync Layer │                     │
│              │ (WebSocket) │                     │
│              └──────┬──────┘                     │
└─────────────────────┼───────────────────────────-┘
                      │ WebSocket
┌─────────────────────┼───────────────────────────-┐
│              NestJS Server                        │
│  ┌──────────────────┴──────────────────────────┐ │
│  │         WebSocket Gateway                    │ │
│  │    Yjs Sync Protocol + Awareness Protocol    │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Angular 19** | Frontend framework (standalone components, signals) |
| **Yjs** | CRDT library for conflict-free data structures |
| **y-indexeddb** | Client-side persistence in IndexedDB |
| **y-websocket** | WebSocket provider for Yjs synchronization |
| **NestJS** | Backend framework for WebSocket relay server |
| **Angular CDK** | Drag-and-drop block reordering |

---

## Getting Started

```bash
git clone https://github.com/your-username/local-first-system.git
cd local-first-system
npm install
npm run dev
```

The client runs on `http://localhost:4200` and the server on `http://localhost:3000`.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start both client and server concurrently |
| `npm run client` | Start Angular dev server only |
| `npm run server` | Start NestJS server only |
| `npm run build:client` | Production build of the client |
| `npm run build:server` | Production build of the server |

---

## Demo Scenarios

### 1. Real-time Collaboration
1. Open `http://localhost:4200` in two browser windows
2. Create a document in one window
3. Copy the URL and open it in the second window
4. Edit simultaneously — see changes appear in real-time

### 2. Offline Editing
1. Open a document
2. Click "Simulate Offline" in the status bar
3. Continue editing — all changes are saved locally
4. Click "Go Online" — changes sync automatically

### 3. Multi-tab Sync
1. Open the same document in two browser tabs
2. Edit in one tab — changes appear in the other tab
3. Only one tab maintains the WebSocket connection (leader election)

### 4. Conflict Resolution
1. Open two windows on the same document
2. Simulate offline in one window
3. Edit the same block in both windows
4. Reconnect — CRDT merges both edits without data loss

---

## Project Structure

```
local-first-system/
├── apps/
│   ├── client/                 # Angular 19 frontend
│   │   └── src/app/
│   │       ├── core/services/  # Document, Sync, Persistence, Awareness, Connection
│   │       ├── features/
│   │       │   ├── document-list/
│   │       │   └── editor/     # Editor, Block, Toolbar, Presence components
│   │       └── shared/         # ConnectionStatus, SlashCommand components
│   └── server/                 # NestJS backend
│       └── src/
│           ├── sync/           # WebSocket gateway for Yjs sync
│           └── documents/      # REST API for metadata
├── libs/
│   └── shared/                 # Shared TypeScript types
│       └── src/types/          # BlockType, DocumentMeta, SyncMessage
├── docs/                       # Architecture documentation
└── package.json                # npm workspaces root
```

---

## Architecture Decisions

See [`docs/adr/`](docs/adr/) for detailed Architecture Decision Records:

- **ADR-001**: Yjs chosen as CRDT library for mature ecosystem and IndexedDB/WebSocket providers
- **ADR-002**: IndexedDB as primary store, server as relay — true local-first
- **ADR-003**: Custom NestJS WebSocket gateway over standalone y-websocket server

---

## Lessons Learned

1. **Local-first != offline caching** — the client is the primary source of truth, not a cache of server state
2. **CRDTs eliminate conflict dialogs** — concurrent edits merge automatically at the data structure level
3. **Yjs transactions are key** — batching mutations in `transact()` prevents intermediate state flicker
4. **Awareness is ephemeral** — cursor positions and presence data are separate from document state
5. **IndexedDB is surprisingly capable** — with y-indexeddb, multi-megabyte documents load instantly
6. **BroadcastChannel enables multi-tab** — only one tab needs a WebSocket connection

---

## License

MIT
