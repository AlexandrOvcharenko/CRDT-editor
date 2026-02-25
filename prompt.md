# Prompt: Local-First Notion Lite (Demo & Learning Project)

## Context

I am building a **demonstration and learning project** to deepen my
understanding of **local-first systems**, including:

-   Offline-parity
-   CRDT-based state management
-   Optimistic replication
-   Eventual consistency
-   Multi-client synchronization

This project is intentionally designed as a **portfolio-grade
educational implementation**, not a production SaaS product. The goal is
to clearly demonstrate architectural understanding and engineering
decisions around local-first design.

------------------------------------------------------------------------

## Project Goal

Build a **Local-First Notion Lite** application with:

-   Block-based document editor (paragraphs, headings, todo blocks,
    etc.)
-   Real-time multi-client collaboration
-   Full offline functionality (offline-parity)
-   Background synchronization when network is restored
-   Conflict-free concurrent editing
-   Multi-tab and multi-device simulation

The application must clearly demonstrate local-first principles rather
than just offline caching.

------------------------------------------------------------------------

## Technology Stack

Frontend: - Angular - IndexedDB (for local persistence) - CRDT library
(e.g., Yjs or Automerge)

Backend: - NestJS - WebSocket-based synchronization layer

Storage: - IndexedDB (client-side primary data store) - Optional server
relay persistence (secondary)

------------------------------------------------------------------------

## Architectural Requirements

The system should include:

1.  Local-first architecture (client is primary source of truth)
2.  Optimistic updates (UI updates immediately without server
    confirmation)
3.  Conflict-free merging (via CRDT)
4.  Background sync engine
5.  WebSocket-based update relay
6.  Multi-tab editing support
7.  Simulated offline mode for testing
8.  Clear separation of:
    -   UI layer
    -   Document/CRDT layer
    -   Persistence layer
    -   Sync layer

------------------------------------------------------------------------

## What I Need From You

Please:

1.  Propose a step-by-step development plan to achieve this goal.
2.  Break the plan into logical implementation phases.
3.  Suggest architectural structure for Angular and NestJS.
4.  Recommend CRDT modeling strategy for block-based documents.
5.  Highlight common pitfalls in local-first systems.
6.  Suggest optional advanced features to make this demo project stand
    out.
7.  Provide guidance on how to structure the GitHub repository and
    README for maximum clarity and portfolio impact.

This is a collaborative planning phase.\
The goal is to create a clean, well-architected demo project that
clearly demonstrates knowledge of local-first systems.
