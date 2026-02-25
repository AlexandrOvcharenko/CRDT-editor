export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface SyncMessage {
  type: 'sync-step-1' | 'sync-step-2' | 'sync-update' | 'awareness';
  docId: string;
  payload: Uint8Array;
}
