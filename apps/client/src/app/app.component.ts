import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConnectionStatusComponent } from './shared/components/connection-status.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConnectionStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
