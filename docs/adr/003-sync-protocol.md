# ADR-003: Custom NestJS WebSocket Gateway

## Status
Accepted

## Context
Yjs provides a standalone WebSocket server (`y-websocket/bin/server.js`). We could either use that directly or integrate the sync protocol into our NestJS server.

## Decision
We implemented a **custom NestJS WebSocket Gateway** that handles the Yjs sync protocol.

Rationale:
1. **Portfolio value** — demonstrates understanding of the Yjs sync protocol internals
2. **Extensibility** — can add authentication, authorization, rate limiting, and logging
3. **Single server** — one process serves both REST API and WebSocket connections
4. **Control** — custom document lifecycle management (creation, cleanup, persistence hooks)

## Consequences
- More code to maintain vs. using the off-the-shelf y-websocket server
- Must keep sync protocol implementation compatible with Yjs updates
- Need to handle edge cases (reconnection, partial state transfer) ourselves
