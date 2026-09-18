import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class AppController {
  @Version(VERSION_NEUTRAL)
  @Get('health')
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
