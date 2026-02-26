import { Injectable, signal } from '@angular/core';
import * as Y from 'yjs';
import { PersistenceService } from './persistence.service';
import { SyncService } from './sync.service';
import { AwarenessService } from './awareness.service';

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

  private readonly _content = signal<string>('');
  private readonly _title = signal<string>('');
  private readonly _isLoaded = signal(false);
  private readonly _currentDocId = signal<string | null>(null);

  readonly content = this._content.asReadonly();
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

    this._content.set('');
    this._title.set('');
    this._isLoaded.set(false);
    this._currentDocId.set(null);
  }

  private setupObservers(): void {
    if (!this.ydoc) return;

    const meta = this.ydoc.getMap('meta');
    const content = this.ydoc.get('content', Y.Text) as Y.Text;

    meta.observe(() => {
      this._title.set((meta.get('title') as string) || '');
    });
    content.observe(() => {
      this._content.set(content.toString());
    });
  }

  private setupUndoManager(): void {
    if (!this.ydoc) return;

    const content = this.ydoc.get('content', Y.Text) as Y.Text;

    this.undoManager = new Y.UndoManager([content], {
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
    if (!this.ydoc) return;

    const meta = this.ydoc.getMap('meta');
    const content = this.ydoc.get('content', Y.Text) as Y.Text;

    this._title.set((meta.get('title') as string) || '');
    this._content.set(content.toString());
  }

  initializeDocument(title: string): void {
    if (!this.ydoc) return;

    const meta = this.ydoc.getMap('meta');
    const content = this.ydoc.get('content', Y.Text) as Y.Text;

    if (!meta.get('createdAt')) {
      this.ydoc.transact(() => {
        meta.set('title', title);
        meta.set('createdAt', Date.now());
        meta.set('updatedAt', Date.now());
        // content Y.Text is created empty by get() above
      });
    }
  }

  setContent(text: string): void {
    if (!this.ydoc) return;

    const content = this.ydoc.get('content', Y.Text) as Y.Text;

    this.ydoc.transact(() => {
      if (!this.ydoc) return;

      content.delete(0, content.length);

      if (text.length > 0) {
        content.insert(0, text);
      }

      this.ydoc.getMap('meta').set('updatedAt', Date.now());
    });
  }

  setTitle(title: string): void {
    if (!this.ydoc) return;

    const meta = this.ydoc.getMap('meta');

    this.ydoc.transact(() => {
      meta.set('title', title);
      meta.set('updatedAt', Date.now());
    });
  }

  undo(): void {
    this.undoManager?.undo();
  }

  redo(): void {
    this.undoManager?.redo();
  }

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
