import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErroRespostaDto } from '../common/dto/erro-resposta.dto';
import { IdDaRota } from '../common/id-da-rota.decorator';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { FiltrarTarefasDto } from './dto/filtrar-tarefas.dto';
import { Tarefa } from './tarefa.entity';
import { TarefasService } from './tarefas.service';

@ApiTags('Tarefas')
@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as tarefas, com filtros opcionais' })
  @ApiOkResponse({ type: [Tarefa] })
  @ApiBadRequestResponse({
    type: ErroRespostaDto,
    description: 'Filtro inválido',
  })
  listar(@Query() filtro: FiltrarTarefasDto): Promise<Tarefa[]> {
    return this.tarefasService.listar(filtro);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma tarefa pelo id' })
  @ApiOkResponse({ type: Tarefa })
  @ApiBadRequestResponse({ type: ErroRespostaDto, description: 'Id inválido' })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Tarefa não encontrada',
  })
  buscar(@IdDaRota() id: number): Promise<Tarefa> {
    return this.tarefasService.buscar(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma tarefa' })
  @ApiCreatedResponse({ type: Tarefa })
  @ApiBadRequestResponse({
    type: ErroRespostaDto,
    description: 'Dados inválidos ou categoria inexistente',
  })
  criar(@Body() dto: CriarTarefaDto): Promise<Tarefa> {
    return this.tarefasService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza só os campos enviados de uma tarefa' })
  @ApiBody({
    type: AtualizarTarefaDto,
    examples: {
      concluir: {
        summary: 'Marcar como concluída',
        value: { concluida: true },
      },
      renomear: {
        summary: 'Trocar só o título',
        value: { titulo: 'Estudar NestJS a fundo' },
      },
      tirarCategoria: {
        summary: 'Deixar sem categoria',
        value: { categoriaId: null },
      },
    },
  })
  @ApiOkResponse({ type: Tarefa })
  @ApiBadRequestResponse({
    type: ErroRespostaDto,
    description: 'Id ou dados inválidos, ou categoria inexistente',
  })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Tarefa não encontrada',
  })
  atualizar(
    @IdDaRota() id: number,
    @Body() dto: AtualizarTarefaDto,
  ): Promise<Tarefa> {
    return this.tarefasService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove uma tarefa' })
  @ApiNoContentResponse({ description: 'Tarefa removida' })
  @ApiBadRequestResponse({ type: ErroRespostaDto, description: 'Id inválido' })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Tarefa não encontrada',
  })
  remover(@IdDaRota() id: number): Promise<void> {
    return this.tarefasService.remover(id);
  }
}
