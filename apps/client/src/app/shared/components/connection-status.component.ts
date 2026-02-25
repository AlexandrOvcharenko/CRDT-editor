import { Component, inject } from '@angular/core';
import { ConnectionService } from '../../core/services/connection.service';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-connection-status',
  standalone: true,
  templateUrl: './connection-status.component.html',
  styleUrl: './connection-status.component.scss',
})
export class ConnectionStatusComponent {
  readonly connectionService = inject(ConnectionService);
  private readonly syncService = inject(SyncService);

  statusClass() {
    if (this.connectionService.isSimulatedOffline() || !this.connectionService.isOnline()) {
      return 'disconnected';
    }
    return this.syncService.syncStatus();
  }

  statusLabel() {
    if (this.connectionService.isSimulatedOffline()) return 'Simulated Offline';
    if (!this.connectionService.isOnline()) return 'Offline';
    const status = this.syncService.syncStatus();
    if (status === 'connected') return 'Connected';
    if (status === 'connecting') return 'Connecting...';
    return 'Disconnected';
  }

  toggleOffline() {
    this.connectionService.toggleSimulatedOffline(this.syncService);
  }
}
