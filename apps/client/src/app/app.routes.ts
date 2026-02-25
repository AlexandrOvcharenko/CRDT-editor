import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/document-list/document-list.component').then(
        (m) => m.DocumentListComponent
      ),
  },
  {
    path: 'doc/:id',
    loadComponent: () =>
      import('./features/editor/editor.component').then(
        (m) => m.EditorComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
