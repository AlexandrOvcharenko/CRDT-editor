import { Component, computed, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ConnectionService } from '../../core/services/connection.service';
import { SyncService } from '../../core/services/sync.service';

@Component({
  selector: 'app-connection-status',
  imports: [NgClass],
  templateUrl: './connection-status.component.html',
  styleUrl: './connection-status.component.scss',
})
export class ConnectionStatusComponent {
  readonly connectionService = inject(ConnectionService);
  private readonly syncService = inject(SyncService);

  readonly statusClass = computed(() => {
    const isConnected = this.connectionService.isOnline() && !this.connectionService.isSimulatedOffline();
    return isConnected ? 'connected' : 'disconnected';
  });

  readonly statusLabel = computed(() => {
    if (this.connectionService.isSimulatedOffline()) return 'Simulated Offline';
    if (!this.connectionService.isOnline()) return 'Offline';
  
    const status = this.syncService.syncStatus();
    if (status === 'connected') return 'Connected';
    if (status === 'connecting') return 'Connecting...';
    return 'Disconnected';
  });

  toggleOffline() {
    this.connectionService.toggleSimulatedOffline(this.syncService);
  }
}
