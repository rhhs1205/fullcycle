import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { ResumoDto } from './dto/resumo.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  @ApiOperation({
    summary: 'Resume as tarefas: totais, prioridades, categorias e próximas',
  })
  @ApiOkResponse({ type: ResumoDto })
  resumo(): Promise<ResumoDto> {
    return this.dashboardService.resumo();
  }
}
