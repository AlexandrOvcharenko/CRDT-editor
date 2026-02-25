import { Injectable, signal } from '@angular/core';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private provider: IndexeddbPersistence | null = null;
  private readonly _isSynced = signal(false);

  readonly isSynced = this._isSynced.asReadonly();

  async connect(docId: string, ydoc: Y.Doc): Promise<void> {
    this.disconnect();

    this.provider = new IndexeddbPersistence(`local-first:${docId}`, ydoc);

    return new Promise<void>((resolve) => {
      this.provider!.on('synced', () => {
        this._isSynced.set(true);
        resolve();
      });
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this._isSynced.set(false);
    }
  }

  async clearDocument(docId: string): Promise<void> {
    const db = indexedDB;
    return new Promise((resolve, reject) => {
      const request = db.deleteDatabase(`local-first:${docId}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
