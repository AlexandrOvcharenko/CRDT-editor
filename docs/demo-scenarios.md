# Demo Scenarios

## Scenario 1: Basic Editing

1. Open `http://localhost:4200`
2. Click "New Document"
3. Type a title
4. Use blocks: type text, press Enter for new blocks
5. Type "/" on an empty block to open the slash command menu
6. Select different block types: Heading, To-do, Quote, Divider

## Scenario 2: Real-time Collaboration

1. Open the app in two browser windows (different windows, not tabs)
2. Navigate to the same document in both
3. Start typing in one window — text appears in the other
4. Notice the presence avatars showing connected users
5. Add a to-do item in one window, check it in the other

## Scenario 3: Offline Editing

1. Open a document and add some content
2. Click "Simulate Offline" in the top status bar
3. Notice the status bar turns red
4. Continue editing — add blocks, modify text, reorder with drag-and-drop
5. Open DevTools > Application > IndexedDB to see data being persisted locally
6. Click "Go Online" — notice the bar turns green and all changes sync

## Scenario 4: Conflict-Free Merging

1. Open the same document in two windows
2. Click "Simulate Offline" in Window B
3. In Window A: add a new paragraph with "Edit from Window A"
4. In Window B: add a new paragraph with "Edit from Window B"
5. In Window B: click "Go Online"
6. Both edits appear in both windows — no conflicts, no data loss

## Scenario 5: Multi-tab Synchronization

1. Open the same document in Tab 1 and Tab 2 of the same browser
2. Edit in Tab 1 — changes appear instantly in Tab 2
3. Check DevTools > Network in Tab 2 — no WebSocket connection
4. Only Tab 1 maintains the server connection (leader election)
5. Close Tab 1 — Tab 2 takes over as the WebSocket leader

## Scenario 6: Drag-and-Drop Reordering

1. Create a document with 5+ blocks of different types
2. Hover over the left side of any block to reveal the drag handle
3. Drag a block to a new position
4. Open the same document in another window — see the new order

## Scenario 7: Undo/Redo

1. Make several edits to a document
2. Click the Undo button (or Ctrl+Z) to reverse changes
3. Click the Redo button (or Ctrl+Shift+Z) to reapply
4. Undo/Redo respects block boundaries and batches related changes
