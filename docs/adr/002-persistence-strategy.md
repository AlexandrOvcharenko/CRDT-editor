# ADR-002: IndexedDB as Primary Store

## Status
Accepted

## Context
In a local-first system, we need to decide where the primary copy of data lives. Options: server database, localStorage, IndexedDB, or filesystem.

## Decision
**IndexedDB is the primary data store**. The server only relays updates between peers.

Rationale:
1. **True local-first** — the client owns the data, not the server
2. **Large capacity** — IndexedDB supports multi-megabyte documents (unlike localStorage's ~5MB limit)
3. **Async API** — non-blocking reads/writes don't freeze the UI
4. **y-indexeddb** — Yjs has a battle-tested IndexedDB provider that handles incremental updates efficiently
5. **Offline-parity** — documents load instantly from IndexedDB, even before network is available

## Consequences
- Data is browser-scoped — clearing browser data loses documents
- Cross-device sync requires the relay server
- Need to monitor IndexedDB quota in long-running sessions
