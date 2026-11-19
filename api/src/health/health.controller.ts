import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatusDto, StatusIndisponivelDto } from './dto/status.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Confere se a API e o banco estão no ar' })
  @ApiOkResponse({ type: StatusDto })
  @ApiServiceUnavailableResponse({
    type: StatusIndisponivelDto,
    description: 'A API está no ar, mas o banco não respondeu',
  })
  verificar(): Promise<StatusDto> {
    return this.healthService.verificar();
  }
}
