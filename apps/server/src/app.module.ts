import { Module } from '@nestjs/common';
import { SyncModule } from './sync/sync.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [SyncModule, DocumentsModule],
})
export class AppModule {}
