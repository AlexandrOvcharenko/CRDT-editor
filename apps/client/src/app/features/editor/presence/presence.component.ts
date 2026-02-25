import { Component, inject } from '@angular/core';
import { AwarenessService } from '../../../core/services/awareness.service';

@Component({
  selector: 'app-presence',
  standalone: true,
  templateUrl: './presence.component.html',
  styleUrl: './presence.component.scss',
})
export class PresenceComponent {
  readonly awarenessService = inject(AwarenessService);
}
