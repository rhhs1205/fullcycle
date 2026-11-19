import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CategoriasService } from '../categorias/categorias.service';
import { AtualizarTarefaDto } from './dto/atualizar-tarefa.dto';
import { CriarTarefaDto } from './dto/criar-tarefa.dto';
import { FiltrarTarefasDto } from './dto/filtrar-tarefas.dto';
import { Tarefa } from './tarefa.entity';

const tarefaNaoEncontrada = (id: number) =>
  new NotFoundException(`Tarefa ${id} não encontrada`);

const escaparParaLike = (texto: string): string =>
  texto.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class TarefasService {
  constructor(
    @InjectRepository(Tarefa)
    private readonly repositorio: Repository<Tarefa>,
    private readonly categoriasService: CategoriasService,
  ) {}

  listar(filtro: FiltrarTarefasDto = {}): Promise<Tarefa[]> {
    return this.repositorio.find({
      where: this.montarFiltro(filtro),
      relations: { categoria: true },
      order: { concluida: 'ASC', criadaEm: 'DESC' },
    });
  }

  async buscar(id: number): Promise<Tarefa> {
    const tarefa = await this.repositorio.findOne({
      where: { id },
      relations: { categoria: true },
    });
    if (!tarefa) {
      throw tarefaNaoEncontrada(id);
    }
    return tarefa;
  }

  async criar(dto: CriarTarefaDto): Promise<Tarefa> {
    await this.validarCategoria(dto.categoriaId);
    const tarefa = await this.repositorio.save(this.repositorio.create(dto));
    return this.buscar(tarefa.id);
  }

  async atualizar(id: number, dto: AtualizarTarefaDto): Promise<Tarefa> {
    const tarefa = await this.repositorio.findOneBy({ id });
    if (!tarefa) {
      throw tarefaNaoEncontrada(id);
    }
    await this.validarCategoria(dto.categoriaId);
    await this.repositorio.save(this.repositorio.merge(tarefa, dto));
    return this.buscar(id);
  }

  async remover(id: number): Promise<void> {
    const tarefa = await this.repositorio.findOneBy({ id });
    if (!tarefa) {
      throw tarefaNaoEncontrada(id);
    }
    await this.repositorio.remove(tarefa);
  }

  private montarFiltro(
    filtro: FiltrarTarefasDto,
  ): FindOptionsWhere<Tarefa> | FindOptionsWhere<Tarefa>[] {
    const where: FindOptionsWhere<Tarefa> = {};
    if (filtro.concluida !== undefined) {
      where.concluida = filtro.concluida;
    }
    if (filtro.prioridade !== undefined) {
      where.prioridade = filtro.prioridade;
    }
    if (filtro.categoriaId !== undefined) {
      where.categoriaId = filtro.categoriaId;
    }
    if (!filtro.busca) {
      return where;
    }
    const termo = ILike(`%${escaparParaLike(filtro.busca)}%`);
    return [
      { ...where, titulo: termo },
      { ...where, descricao: termo },
    ];
  }

  private async validarCategoria(categoriaId?: number | null): Promise<void> {
    if (categoriaId === undefined || categoriaId === null) {
      return;
    }
    if (!(await this.categoriasService.existe(categoriaId))) {
      throw new BadRequestException(`Categoria ${categoriaId} não existe`);
    }
  }
}
