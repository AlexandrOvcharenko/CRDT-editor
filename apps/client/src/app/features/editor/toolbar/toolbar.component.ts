import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  readonly canUndo = input(false);
  readonly canRedo = input(false);
  readonly undo = output<void>();
  readonly redo = output<void>();
}
