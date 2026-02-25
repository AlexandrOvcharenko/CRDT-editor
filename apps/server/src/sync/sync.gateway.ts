import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { WebSocket } from 'ws';

const MSG_SYNC = 0;
const MSG_AWARENESS = 1;

interface SharedDoc {
  ydoc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
  conns: Map<WebSocket, Set<number>>;
}

@WebSocketGateway({ path: '/yjs' })
export class SyncGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(SyncGateway.name);
  private readonly docs = new Map<string, SharedDoc>();

  private getOrCreateDoc(docName: string): SharedDoc {
    let doc = this.docs.get(docName);
    if (doc) return doc;

    const ydoc = new Y.Doc({ gc: true });
    const awareness = new awarenessProtocol.Awareness(ydoc);

    awareness.setLocalState(null);

    doc = { ydoc, awareness, conns: new Map() };

    awareness.on(
      'update',
      (
        { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
        conn: WebSocket | null,
      ) => {
        const changedClients = added.concat(updated, removed);
        if (conn) {
          const connControlledIds = doc!.conns.get(conn);
          if (connControlledIds) {
            added.forEach((id) => connControlledIds.add(id));
            removed.forEach((id) => connControlledIds.delete(id));
          }
        }

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MSG_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients),
        );
        const message = encoding.toUint8Array(encoder);
        doc!.conns.forEach((_, c) => this.send(c, message));
      },
    );

    this.docs.set(docName, doc);
    this.logger.log(`Document created: ${docName}`);
    return doc;
  }

  handleConnection(client: WebSocket, ...args: any[]) {
    const req = args[0];
    const url = req?.url || '';
    const docName = url.replace(/^\/yjs\//, '').split('?')[0] || 'default';

    this.logger.log(`Client connected to document: ${docName}`);

    const doc = this.getOrCreateDoc(docName);
    doc.conns.set(client, new Set());

    client.on('message', (rawMsg: ArrayBuffer | Buffer) => {
      try {
        const message = new Uint8Array(rawMsg as ArrayBuffer);
        const decoder = decoding.createDecoder(message);
        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case MSG_SYNC:
            this.handleSyncMessage(decoder, doc, client);
            break;
          case MSG_AWARENESS:
            this.handleAwarenessMessage(decoder, doc, client);
            break;
        }
      } catch (err) {
        this.logger.error('Error processing message', err);
      }
    });

    // Send initial sync step 1
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    syncProtocol.writeSyncStep1(encoder, doc.ydoc);
    this.send(client, encoding.toUint8Array(encoder));

    // Send awareness states
    const awarenessStates = doc.awareness.getStates();
    if (awarenessStates.size > 0) {
      const awarenessEncoder = encoding.createEncoder();
      encoding.writeVarUint(awarenessEncoder, MSG_AWARENESS);
      encoding.writeVarUint8Array(
        awarenessEncoder,
        awarenessProtocol.encodeAwarenessUpdate(
          doc.awareness,
          Array.from(awarenessStates.keys()),
        ),
      );
      this.send(client, encoding.toUint8Array(awarenessEncoder));
    }
  }

  handleDisconnect(client: WebSocket) {
    this.docs.forEach((doc, docName) => {
      if (doc.conns.has(client)) {
        const controlledIds = doc.conns.get(client)!;
        doc.conns.delete(client);
        awarenessProtocol.removeAwarenessStates(
          doc.awareness,
          Array.from(controlledIds),
          null,
        );
        this.logger.log(`Client disconnected from: ${docName}`);

        if (doc.conns.size === 0) {
          doc.ydoc.destroy();
          doc.awareness.destroy();
          this.docs.delete(docName);
          this.logger.log(`Document destroyed: ${docName}`);
        }
      }
    });
  }

  private handleSyncMessage(
    decoder: decoding.Decoder,
    doc: SharedDoc,
    client: WebSocket,
  ) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MSG_SYNC);
    const syncMessageType = syncProtocol.readSyncMessage(
      decoder,
      encoder,
      doc.ydoc,
      null,
    );

    if (encoding.length(encoder) > 1) {
      this.send(client, encoding.toUint8Array(encoder));
    }

    if (syncMessageType === 2) {
      // Yjs update — broadcast to all other connections
      const updateEncoder = encoding.createEncoder();
      encoding.writeVarUint(updateEncoder, MSG_SYNC);
      syncProtocol.writeUpdate(updateEncoder, Y.encodeStateAsUpdate(doc.ydoc));
      const message = encoding.toUint8Array(updateEncoder);
      doc.conns.forEach((_, conn) => {
        if (conn !== client) {
          this.send(conn, message);
        }
      });
    }
  }

  private handleAwarenessMessage(
    decoder: decoding.Decoder,
    doc: SharedDoc,
    client: WebSocket,
  ) {
    awarenessProtocol.applyAwarenessUpdate(
      doc.awareness,
      decoding.readVarUint8Array(decoder),
      client,
    );
  }

  private send(client: WebSocket, message: Uint8Array) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}
