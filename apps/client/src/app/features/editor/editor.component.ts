import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DocumentService } from '../../core/services/document.service';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { PresenceComponent } from './presence/presence.component';

@Component({
  selector: 'app-editor',
  imports: [ToolbarComponent, PresenceComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy {
  readonly docService = inject(DocumentService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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

  onContentInput(event: Event) {
    const value = (event.target as HTMLTextAreaElement).value;
    this.docService.setContent(value);
  }
}
