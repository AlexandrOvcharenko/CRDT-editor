import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class DocumentsController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: Date.now() };
  }
}
