import { Component, inject, OnInit, OnDestroy, signal, ViewChild, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { DocumentService } from '../../core/services/document.service';
import { ConnectionService } from '../../core/services/connection.service';
import { SyncService } from '../../core/services/sync.service';
import { AwarenessService } from '../../core/services/awareness.service';
import { BlockComponent } from './block/block.component';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PresenceComponent } from './presence/presence.component';
import { SlashCommandComponent } from '../../shared/components/slash-command.component';
import { BlockType } from '@local-first/shared';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [
    DragDropModule,
    BlockComponent,
    ToolbarComponent,
    PresenceComponent,
    SlashCommandComponent,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy {
  readonly docService = inject(DocumentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly awarenessService = inject(AwarenessService);

  readonly showSlashMenu = signal(false);
  readonly slashMenuPosition = signal({ top: 0, left: 0 });
  private slashBlockId: string | null = null;

  @ViewChild(SlashCommandComponent) slashMenu?: SlashCommandComponent;

  async ngOnInit() {
    const docId = this.route.snapshot.paramMap.get('id');
    if (!docId) {
      this.router.navigate(['/']);
      return;
    }

    await this.docService.openDocument(docId);
    this.docService.initializeDocument('Untitled');
  }

  ngOnDestroy() {
    if (this.docService.currentDocId()) {
      this.docService.updateDocumentInList(
        this.docService.currentDocId()!,
        this.docService.title() || 'Untitled',
      );
    }
    this.docService.closeDocument();
  }

  goBack() {
    if (this.docService.currentDocId()) {
      this.docService.updateDocumentInList(
        this.docService.currentDocId()!,
        this.docService.title() || 'Untitled',
      );
    }
    this.router.navigate(['/']);
  }

  onTitleChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.docService.setTitle(value);
  }

  onContentChanged(blockId: string, content: string) {
    this.docService.updateBlockContent(blockId, content);
  }

  onTypeChanged(blockId: string, type: BlockType) {
    this.docService.changeBlockType(blockId, type);
  }

  onPropChanged(blockId: string, change: { key: string; value: unknown }) {
    this.docService.updateBlockProp(blockId, change.key, change.value);
  }

  onEnterPressed(blockId: string) {
    const ids = this.docService.blockIds();
    const index = ids.indexOf(blockId);
    const newId = this.docService.addBlock('paragraph', index + 1);
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newId}"] [contenteditable]`) as HTMLElement;
      el?.focus();
    }, 50);
  }

  onDeletePressed(blockId: string) {
    const ids = this.docService.blockIds();
    const index = ids.indexOf(blockId);
    if (ids.length <= 1) return;

    this.docService.deleteBlock(blockId);
    setTimeout(() => {
      const prevId = ids[Math.max(0, index - 1)];
      if (prevId && prevId !== blockId) {
        const el = document.querySelector(`[data-block-id="${prevId}"] [contenteditable]`) as HTMLElement;
        el?.focus();
      }
    }, 50);
  }

  onSlashTriggered(blockId: string, event: { top: number; left: number }) {
    this.slashBlockId = blockId;
    this.slashMenuPosition.set(event);
    this.showSlashMenu.set(true);
  }

  onSlashCommand(type: BlockType) {
    this.showSlashMenu.set(false);
    if (this.slashBlockId) {
      this.docService.changeBlockType(this.slashBlockId, type);
      this.docService.updateBlockContent(this.slashBlockId, '');
    }
  }

  onBlockFocused(blockId: string) {
    this.awarenessService.updateCursor(blockId);
  }

  onBlockDrop(event: CdkDragDrop<string[]>) {
    this.docService.moveBlock(event.previousIndex, event.currentIndex);
  }

  addBlockAtEnd() {
    const newId = this.docService.addBlock('paragraph');
    setTimeout(() => {
      const el = document.querySelector(`[data-block-id="${newId}"] [contenteditable]`) as HTMLElement;
      el?.focus();
    }, 50);
  }
}
