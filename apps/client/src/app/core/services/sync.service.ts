import { Injectable, signal } from '@angular/core';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { ConnectionService } from './connection.service';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private provider: WebsocketProvider | null = null;

  private readonly _syncStatus = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  readonly syncStatus = this._syncStatus.asReadonly();

  constructor(private connectionService: ConnectionService) {}

  connect(docId: string, ydoc: Y.Doc): void {
    this.disconnect();

    const wsUrl = this.getWsUrl();
    this.provider = new WebsocketProvider(wsUrl, docId, ydoc, {
      connect: this.connectionService.isOnline(),
    });

    this.provider.on('status', ({ status }: { status: string }) => {
      this._syncStatus.set(status as 'disconnected' | 'connecting' | 'connected');
    });
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
      this._syncStatus.set('disconnected');
    }
  }

  getProvider(): WebsocketProvider | null {
    return this.provider;
  }

  simulateOffline(): void {
    if (this.provider) {
      this.provider.disconnect();
      this._syncStatus.set('disconnected');
    }
  }

  simulateOnline(): void {
    if (this.provider) {
      this.provider.connect();
    }
  }

  private getWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/yjs`;
  }
}
