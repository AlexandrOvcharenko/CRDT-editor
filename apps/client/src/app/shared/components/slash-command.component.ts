import { Component, output, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { BlockType } from '@local-first/shared';

interface CommandItem {
  type: BlockType;
  label: string;
  description: string;
  icon: string;
}

const COMMANDS: CommandItem[] = [
  { type: 'paragraph', label: 'Text', description: 'Plain text block', icon: 'Aa' },
  { type: 'heading', label: 'Heading', description: 'Section heading', icon: 'H' },
  { type: 'todo', label: 'To-do', description: 'Checkable item', icon: '\u2611' },
  { type: 'quote', label: 'Quote', description: 'Highlighted text', icon: '\u201C' },
  { type: 'divider', label: 'Divider', description: 'Horizontal rule', icon: '\u2014' },
];

@Component({
  selector: 'app-slash-command',
  standalone: true,
  templateUrl: './slash-command.component.html',
  styleUrl: './slash-command.component.scss',
})
export class SlashCommandComponent implements AfterViewInit {
  @ViewChild('menu') menuEl!: ElementRef<HTMLDivElement>;

  readonly commandSelected = output<BlockType>();
  readonly closed = output<void>();

  readonly filter = signal('');
  readonly selectedIndex = signal(0);

  readonly filteredCommands = () => {
    const f = this.filter().toLowerCase();
    if (!f) return COMMANDS;
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(f) || c.type.includes(f)
    );
  };

  ngAfterViewInit() {
    this.menuEl?.nativeElement?.focus();
  }

  select(cmd: CommandItem) {
    this.commandSelected.emit(cmd.type);
  }

  handleKeydown(event: KeyboardEvent): boolean {
    const cmds = this.filteredCommands();
    switch (event.key) {
      case 'ArrowDown':
        this.selectedIndex.update((i) => (i + 1) % cmds.length);
        return true;
      case 'ArrowUp':
        this.selectedIndex.update((i) => (i - 1 + cmds.length) % cmds.length);
        return true;
      case 'Enter':
        if (cmds.length > 0) {
          this.select(cmds[this.selectedIndex()]);
        }
        return true;
      case 'Escape':
        this.closed.emit();
        return true;
      default:
        return false;
    }
  }

  updateFilter(text: string) {
    this.filter.set(text);
    this.selectedIndex.set(0);
  }
}
