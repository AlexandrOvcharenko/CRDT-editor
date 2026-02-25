import {
  Component,
  input,
  output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { BlockSnapshot } from '../../../core/services/document.service';
import { AwarenessService, UserAwareness } from '../../../core/services/awareness.service';
import { BlockType } from '@local-first/shared';

@Component({
  selector: 'app-block',
  standalone: true,
  templateUrl: './block.component.html',
  styleUrl: './block.component.scss',
})
export class BlockComponent implements AfterViewInit, OnChanges {
  readonly blockId = input.required<string>();
  readonly block = input.required<BlockSnapshot>();

  readonly contentChanged = output<string>();
  readonly typeChanged = output<BlockType>();
  readonly propChanged = output<{ key: string; value: unknown }>();
  readonly enterPressed = output<void>();
  readonly deletePressed = output<void>();
  readonly slashTriggered = output<{ top: number; left: number }>();
  readonly focused = output<void>();

  @ViewChild('contentEl') contentEl?: ElementRef<HTMLDivElement>;

  private readonly awarenessService = inject(AwarenessService);
  private isUpdatingFromProp = false;

  readonly blockCursors = () => {
    return this.awarenessService
      .remoteUsers()
      .filter((u) => u.cursor?.blockId === this.blockId());
  };

  contentClass(): string {
    const b = this.block();
    if (b.type === 'heading') {
      const level = (b.props['level'] as number) || 2;
      return `heading-${level}`;
    }
    if (b.type === 'quote') return 'quote-block';
    return '';
  }

  placeholder(): string {
    switch (this.block().type) {
      case 'heading': return 'Heading';
      case 'todo': return 'To-do';
      case 'quote': return 'Quote';
      case 'paragraph': return "Type '/' for commands";
      default: return '';
    }
  }

  ngAfterViewInit() {
    this.syncContent();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['block'] && this.contentEl && !this.isUpdatingFromProp) {
      const el = this.contentEl.nativeElement;
      if (el.textContent !== this.block().content) {
        this.syncContent();
      }
    }
  }

  private syncContent() {
    if (!this.contentEl) return;
    const el = this.contentEl.nativeElement;
    if (el.textContent !== this.block().content) {
      this.isUpdatingFromProp = true;
      el.textContent = this.block().content;
      this.isUpdatingFromProp = false;
    }
  }

  onInput() {
    if (this.isUpdatingFromProp || !this.contentEl) return;
    const text = this.contentEl.nativeElement.textContent || '';
    this.contentChanged.emit(text);
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enterPressed.emit();
      return;
    }

    if (event.key === 'Backspace' && this.contentEl) {
      const text = this.contentEl.nativeElement.textContent || '';
      if (text === '') {
        event.preventDefault();
        this.deletePressed.emit();
        return;
      }
    }

    if (event.key === '/' && this.contentEl) {
      const text = this.contentEl.nativeElement.textContent || '';
      if (text === '') {
        event.preventDefault();
        const rect = this.contentEl.nativeElement.getBoundingClientRect();
        this.slashTriggered.emit({
          top: rect.bottom + 4,
          left: rect.left,
        });
      }
    }
  }

  onCheckboxChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.propChanged.emit({ key: 'checked', value: checked });
  }

  onFocus() {
    this.focused.emit();
  }
}
