import { Injectable, signal, NgZone } from '@angular/core';
import { SyncService } from './sync.service';

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private readonly _isOnline = signal(navigator.onLine);
  private readonly _isSimulatedOffline = signal(false);

  readonly isOnline = this._isOnline.asReadonly();
  readonly isSimulatedOffline = this._isSimulatedOffline.asReadonly();

  constructor(private ngZone: NgZone) {
    this.setupListeners();
  }

  private setupListeners(): void {
    window.addEventListener('online', () => {
      this.ngZone.run(() => this._isOnline.set(true));
    });
    window.addEventListener('offline', () => {
      this.ngZone.run(() => this._isOnline.set(false));
    });
  }

  toggleSimulatedOffline(syncService: SyncService): void {
    const newState = !this._isSimulatedOffline();
    this._isSimulatedOffline.set(newState);

    if (newState) {
      syncService.simulateOffline();
    } else {
      syncService.simulateOnline();
    }
  }
}
