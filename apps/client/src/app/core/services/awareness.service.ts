import { Injectable, signal } from '@angular/core';
import { WebsocketProvider } from 'y-websocket';

const COLORS = [
  '#ff6b6b', '#51cf66', '#339af0', '#fcc419',
  '#cc5de8', '#22b8cf', '#ff922b', '#20c997',
];

export interface UserAwareness {
  clientId: number;
  name: string;
  color: string;
  cursor: { blockId: string; offset: number } | null;
}

@Injectable({ providedIn: 'root' })
export class AwarenessService {
  private provider: WebsocketProvider | null = null;
  private readonly _remoteUsers = signal<UserAwareness[]>([]);
  private readonly _localUser = signal<{ name: string; color: string }>({
    name: `User ${Math.floor(Math.random() * 1000)}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  });

  readonly remoteUsers = this._remoteUsers.asReadonly();
  readonly localUser = this._localUser.asReadonly();

  connect(provider: WebsocketProvider): void {
    this.provider = provider;

    const user = this._localUser();
    provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color,
      cursor: null,
    });

    provider.awareness.on('change', () => this.refreshUsers());
    this.refreshUsers();
  }

  disconnect(): void {
    this.provider = null;
    this._remoteUsers.set([]);
  }

  updateCursor(blockId: string | null, offset: number = 0): void {
    if (!this.provider) return;
    this.provider.awareness.setLocalStateField('user', {
      ...this._localUser(),
      cursor: blockId ? { blockId, offset } : null,
    });
  }

  setUserName(name: string): void {
    this._localUser.update((u) => ({ ...u, name }));
    if (this.provider) {
      this.provider.awareness.setLocalStateField('user', {
        ...this._localUser(),
        name,
      });
    }
  }

  private refreshUsers(): void {
    if (!this.provider) return;

    const awareness = this.provider.awareness;
    const localClientId = this.provider.doc.clientID;
    const users: UserAwareness[] = [];

    awareness.getStates().forEach((state, clientId) => {
      if (clientId !== localClientId && state.user) {
        users.push({
          clientId,
          name: state.user.name || 'Anonymous',
          color: state.user.color || '#999',
          cursor: state.user.cursor || null,
        });
      }
    });

    this._remoteUsers.set(users);
  }
}
