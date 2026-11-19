import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErroRespostaDto } from '../common/dto/erro-resposta.dto';
import { IdDaRota } from '../common/id-da-rota.decorator';
import { Categoria } from './categoria.entity';
import { CategoriasService } from './categorias.service';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CategoriaComTotalDto } from './dto/categoria-com-total.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@ApiTags('Categorias')
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as categorias com o total de tarefas' })
  @ApiOkResponse({ type: [CategoriaComTotalDto] })
  listar(): Promise<CategoriaComTotalDto[]> {
    return this.categoriasService.listar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca uma categoria pelo id' })
  @ApiOkResponse({ type: Categoria })
  @ApiBadRequestResponse({ type: ErroRespostaDto, description: 'Id inválido' })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Categoria não encontrada',
  })
  buscar(@IdDaRota() id: number): Promise<Categoria> {
    return this.categoriasService.buscar(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma categoria' })
  @ApiCreatedResponse({ type: Categoria })
  @ApiBadRequestResponse({
    type: ErroRespostaDto,
    description: 'Dados inválidos',
  })
  @ApiConflictResponse({
    type: ErroRespostaDto,
    description: 'Já existe uma categoria com esse nome',
  })
  criar(@Body() dto: CriarCategoriaDto): Promise<Categoria> {
    return this.categoriasService.criar(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza só os campos enviados de uma categoria' })
  @ApiBody({
    type: AtualizarCategoriaDto,
    examples: {
      trocarCor: {
        summary: 'Trocar só a cor',
        value: { cor: '#43a047' },
      },
      renomear: {
        summary: 'Trocar só o nome',
        value: { nome: 'Estudos e cursos' },
      },
    },
  })
  @ApiOkResponse({ type: Categoria })
  @ApiBadRequestResponse({
    type: ErroRespostaDto,
    description: 'Id ou dados inválidos',
  })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Categoria não encontrada',
  })
  @ApiConflictResponse({
    type: ErroRespostaDto,
    description: 'Já existe outra categoria com esse nome',
  })
  atualizar(
    @IdDaRota() id: number,
    @Body() dto: AtualizarCategoriaDto,
  ): Promise<Categoria> {
    return this.categoriasService.atualizar(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove uma categoria',
    description: 'As tarefas da categoria continuam existindo, sem categoria.',
  })
  @ApiNoContentResponse({ description: 'Categoria removida' })
  @ApiBadRequestResponse({ type: ErroRespostaDto, description: 'Id inválido' })
  @ApiNotFoundResponse({
    type: ErroRespostaDto,
    description: 'Categoria não encontrada',
  })
  remover(@IdDaRota() id: number): Promise<void> {
    return this.categoriasService.remover(id);
  }
}
