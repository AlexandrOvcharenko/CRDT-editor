import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { DocumentService, DocumentSnapshot } from '../../core/services/document.service';

@Component({
  selector: 'app-document-list',
  standalone: true,
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit {
  private readonly docService = inject(DocumentService);
  private readonly router = inject(Router);

  readonly documents = signal<DocumentSnapshot[]>([]);

  ngOnInit() {
    this.documents.set(this.docService.getStoredDocumentList());
  }

  createDocument() {
    const id = uuidv4();
    this.docService.addDocumentToList(id, 'Untitled');
    this.router.navigate(['/doc', id]);
  }

  openDocument(id: string) {
    this.router.navigate(['/doc', id]);
  }

  deleteDocument(id: string, event: Event) {
    event.stopPropagation();
    this.docService.removeDocumentFromList(id);
    this.documents.set(this.docService.getStoredDocumentList());
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
