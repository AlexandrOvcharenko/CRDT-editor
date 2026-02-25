# ADR-001: Yjs as CRDT Library

## Status
Accepted

## Context
We need a CRDT library for conflict-free collaborative editing in a block-based document editor. The main candidates are Yjs and Automerge.

## Decision
We chose **Yjs** for the following reasons:

1. **Mature ecosystem** — first-class providers for WebSocket (`y-websocket`), IndexedDB (`y-indexeddb`), and BroadcastChannel (built into providers)
2. **Performance** — Yjs is highly optimized with compact binary encoding and efficient garbage collection
3. **Shared types** — `Y.Text`, `Y.Map`, `Y.Array` map directly to block editor data structures
4. **Awareness protocol** — built-in support for ephemeral presence data (cursors, selections)
5. **UndoManager** — built-in undo/redo with scope control

## Consequences
- We depend on the Yjs ecosystem and its sync protocol
- The binary encoding is opaque — debugging requires Yjs-specific tooling
- Document size grows over time without garbage collection (`gc: true` on Y.Doc)
