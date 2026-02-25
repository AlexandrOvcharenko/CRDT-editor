import { Injectable, signal, computed } from '@angular/core';
import * as Y from 'yjs';
import { v4 as uuidv4 } from 'uuid';
import { BlockType, DEFAULT_BLOCK_PROPS } from '@local-first/shared';
import { PersistenceService } from './persistence.service';
import { SyncService } from './sync.service';
import { AwarenessService } from './awareness.service';

export interface BlockSnapshot {
  id: string;
  type: BlockType;
  content: string;
  props: Record<string, unknown>;
  children: string[];
}

export interface DocumentSnapshot {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private ydoc: Y.Doc | null = null;
  private undoManager: Y.UndoManager | null = null;

  private readonly _blockIds = signal<string[]>([]);
  private readonly _blocks = signal<Map<string, BlockSnapshot>>(new Map());
  private readonly _title = signal<string>('');
  private readonly _isLoaded = signal(false);
  private readonly _currentDocId = signal<string | null>(null);

  readonly blockIds = this._blockIds.asReadonly();
  readonly blocks = this._blocks.asReadonly();
  readonly title = this._title.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly currentDocId = this._currentDocId.asReadonly();

  readonly canUndo = signal(false);
  readonly canRedo = signal(false);

  constructor(
    private persistenceService: PersistenceService,
    private syncService: SyncService,
    private awarenessService: AwarenessService,
  ) {}

  async openDocument(docId: string): Promise<void> {
    this.closeDocument();

    this.ydoc = new Y.Doc();
    this._currentDocId.set(docId);

    await this.persistenceService.connect(docId, this.ydoc);
    this.syncService.connect(docId, this.ydoc);
    this.awarenessService.connect(this.syncService.getProvider()!);

    this.setupObservers();
    this.setupUndoManager();
    this.refreshState();
    this._isLoaded.set(true);
  }

  closeDocument(): void {
    if (!this.ydoc) return;

    this.undoManager?.destroy();
    this.undoManager = null;
    this.awarenessService.disconnect();
    this.syncService.disconnect();
    this.persistenceService.disconnect();
    this.ydoc.destroy();
    this.ydoc = null;

    this._blockIds.set([]);
    this._blocks.set(new Map());
    this._title.set('');
    this._isLoaded.set(false);
    this._currentDocId.set(null);
  }

  private setupObservers(): void {
    if (!this.ydoc) return;

    const blockOrder = this.ydoc.getArray<string>('blockOrder');
    const blocks = this.ydoc.getMap('blocks');
    const meta = this.ydoc.getMap('meta');

    blockOrder.observe(() => this.refreshBlockIds());
    blocks.observeDeep(() => this.refreshBlocks());
    meta.observe(() => {
      this._title.set((meta.get('title') as string) || '');
    });
  }

  private setupUndoManager(): void {
    if (!this.ydoc) return;

    const blockOrder = this.ydoc.getArray<string>('blockOrder');
    const blocks = this.ydoc.getMap('blocks');

    this.undoManager = new Y.UndoManager([blockOrder, blocks], {
      captureTimeout: 300,
    });

    this.undoManager.on('stack-item-added', () => {
      this.canUndo.set(this.undoManager!.undoStack.length > 0);
      this.canRedo.set(this.undoManager!.redoStack.length > 0);
    });
    this.undoManager.on('stack-item-popped', () => {
      this.canUndo.set(this.undoManager!.undoStack.length > 0);
      this.canRedo.set(this.undoManager!.redoStack.length > 0);
    });
  }

  private refreshState(): void {
    this.refreshBlockIds();
    this.refreshBlocks();

    if (this.ydoc) {
      const meta = this.ydoc.getMap('meta');
      this._title.set((meta.get('title') as string) || '');
    }
  }

  private refreshBlockIds(): void {
    if (!this.ydoc) return;
    const blockOrder = this.ydoc.getArray<string>('blockOrder');
    this._blockIds.set(blockOrder.toArray());
  }

  private refreshBlocks(): void {
    if (!this.ydoc) return;
    const blocksMap = this.ydoc.getMap('blocks');
    const snapshot = new Map<string, BlockSnapshot>();

    blocksMap.forEach((value, key) => {
      const block = value as Y.Map<unknown>;
      const content = block.get('content') as Y.Text;
      const props = block.get('props') as Y.Map<unknown>;
      const children = block.get('children') as Y.Array<string>;

      snapshot.set(key, {
        id: key,
        type: (block.get('type') as BlockType) || 'paragraph',
        content: content?.toString() || '',
        props: props?.toJSON() || {},
        children: children?.toArray() || [],
      });
    });

    this._blocks.set(snapshot);
  }

  // --- Document operations ---

  initializeDocument(title: string): void {
    if (!this.ydoc) return;

    const meta = this.ydoc.getMap('meta');
    const blockOrder = this.ydoc.getArray<string>('blockOrder');

    if (blockOrder.length === 0) {
      this.ydoc.transact(() => {
        meta.set('title', title);
        meta.set('createdAt', Date.now());
        meta.set('updatedAt', Date.now());
        this.addBlock('paragraph', 0);
      });
    }
  }

  setTitle(title: string): void {
    if (!this.ydoc) return;
    const meta = this.ydoc.getMap('meta');
    this.ydoc.transact(() => {
      meta.set('title', title);
      meta.set('updatedAt', Date.now());
    });
  }

  addBlock(type: BlockType, index?: number): string {
    if (!this.ydoc) return '';

    const blockId = uuidv4();
    const blockOrder = this.ydoc.getArray<string>('blockOrder');
    const blocks = this.ydoc.getMap('blocks');

    this.ydoc.transact(() => {
      const block = new Y.Map();
      block.set('type', type);
      block.set('content', new Y.Text());
      const props = new Y.Map();
      const defaultProps = DEFAULT_BLOCK_PROPS[type];
      Object.entries(defaultProps).forEach(([k, v]) => props.set(k, v));
      block.set('props', props);
      block.set('children', new Y.Array());

      blocks.set(blockId, block);

      const insertIndex = index !== undefined ? index : blockOrder.length;
      blockOrder.insert(insertIndex, [blockId]);

      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });

    return blockId;
  }

  deleteBlock(blockId: string): void {
    if (!this.ydoc) return;

    const blockOrder = this.ydoc.getArray<string>('blockOrder');
    const blocks = this.ydoc.getMap('blocks');

    if (blockOrder.length <= 1) return;

    this.ydoc.transact(() => {
      const idx = blockOrder.toArray().indexOf(blockId);
      if (idx !== -1) {
        blockOrder.delete(idx, 1);
      }
      blocks.delete(blockId);
      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });
  }

  moveBlock(fromIndex: number, toIndex: number): void {
    if (!this.ydoc) return;

    const blockOrder = this.ydoc.getArray<string>('blockOrder');

    this.ydoc.transact(() => {
      const blockId = blockOrder.get(fromIndex);
      blockOrder.delete(fromIndex, 1);
      const adjustedIndex = toIndex > fromIndex ? toIndex - 1 : toIndex;
      blockOrder.insert(adjustedIndex, [blockId]);
      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });
  }

  changeBlockType(blockId: string, newType: BlockType): void {
    if (!this.ydoc) return;

    const blocks = this.ydoc.getMap('blocks');
    const block = blocks.get(blockId) as Y.Map<unknown> | undefined;
    if (!block) return;

    this.ydoc.transact(() => {
      block.set('type', newType);

      const props = block.get('props') as Y.Map<unknown>;
      const currentKeys = Array.from(props.keys());
      currentKeys.forEach((k) => props.delete(k));

      const defaultProps = DEFAULT_BLOCK_PROPS[newType];
      Object.entries(defaultProps).forEach(([k, v]) => props.set(k, v));

      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });
  }

  updateBlockContent(blockId: string, newContent: string): void {
    if (!this.ydoc) return;

    const blocks = this.ydoc.getMap('blocks');
    const block = blocks.get(blockId) as Y.Map<unknown> | undefined;
    if (!block) return;

    const content = block.get('content') as Y.Text;
    if (!content) return;

    this.ydoc.transact(() => {
      content.delete(0, content.length);
      if (newContent.length > 0) {
        content.insert(0, newContent);
      }
      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });
  }

  updateBlockProp(blockId: string, key: string, value: unknown): void {
    if (!this.ydoc) return;

    const blocks = this.ydoc.getMap('blocks');
    const block = blocks.get(blockId) as Y.Map<unknown> | undefined;
    if (!block) return;

    this.ydoc.transact(() => {
      const props = block.get('props') as Y.Map<unknown>;
      props.set(key, value);
      this.ydoc!.getMap('meta').set('updatedAt', Date.now());
    });
  }

  getYText(blockId: string): Y.Text | null {
    if (!this.ydoc) return null;
    const blocks = this.ydoc.getMap('blocks');
    const block = blocks.get(blockId) as Y.Map<unknown> | undefined;
    if (!block) return null;
    return (block.get('content') as Y.Text) || null;
  }

  undo(): void {
    this.undoManager?.undo();
  }

  redo(): void {
    this.undoManager?.redo();
  }

  // --- Document list operations ---

  getStoredDocumentIds(): string[] {
    const stored = localStorage.getItem('local-first:docs');
    return stored ? JSON.parse(stored) : [];
  }

  addDocumentToList(docId: string, title: string): void {
    const docs = this.getStoredDocumentList();
    if (!docs.find((d) => d.id === docId)) {
      docs.push({ id: docId, title, createdAt: Date.now(), updatedAt: Date.now() });
      localStorage.setItem('local-first:docs', JSON.stringify(docs));
    }
  }

  getStoredDocumentList(): DocumentSnapshot[] {
    const stored = localStorage.getItem('local-first:docs');
    return stored ? JSON.parse(stored) : [];
  }

  updateDocumentInList(docId: string, title: string): void {
    const docs = this.getStoredDocumentList();
    const doc = docs.find((d) => d.id === docId);
    if (doc) {
      doc.title = title;
      doc.updatedAt = Date.now();
      localStorage.setItem('local-first:docs', JSON.stringify(docs));
    }
  }

  removeDocumentFromList(docId: string): void {
    const docs = this.getStoredDocumentList().filter((d) => d.id !== docId);
    localStorage.setItem('local-first:docs', JSON.stringify(docs));
  }
}
