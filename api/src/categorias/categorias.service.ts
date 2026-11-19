import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { Tarefa } from '../tarefas/tarefa.entity';
import { Categoria } from './categoria.entity';
import { AtualizarCategoriaDto } from './dto/atualizar-categoria.dto';
import { CategoriaComTotalDto } from './dto/categoria-com-total.dto';
import { CriarCategoriaDto } from './dto/criar-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria)
    private readonly repositorio: Repository<Categoria>,
  ) {}

  async listar(): Promise<CategoriaComTotalDto[]> {
    const { entities, raw } = await this.repositorio
      .createQueryBuilder('categoria')
      .addSelect(
        (subconsulta) =>
          subconsulta
            .select('COUNT(*)::int')
            .from(Tarefa, 'tarefa')
            .where('tarefa.categoriaId = categoria.id'),
        'total_tarefas',
      )
      .orderBy('categoria.nome', 'ASC')
      .getRawAndEntities<{ total_tarefas: number }>();

    return entities.map((categoria, indice) => ({
      ...categoria,
      totalTarefas: raw[indice].total_tarefas,
    }));
  }

  async buscar(id: number): Promise<Categoria> {
    const categoria = await this.repositorio.findOneBy({ id });
    if (!categoria) {
      throw new NotFoundException(`Categoria ${id} não encontrada`);
    }
    return categoria;
  }

  existe(id: number): Promise<boolean> {
    return this.repositorio.existsBy({ id });
  }

  async criar(dto: CriarCategoriaDto): Promise<Categoria> {
    await this.garantirNomeDisponivel(dto.nome);
    return this.repositorio.save(this.repositorio.create(dto));
  }

  async atualizar(id: number, dto: AtualizarCategoriaDto): Promise<Categoria> {
    const categoria = await this.buscar(id);
    if (dto.nome !== undefined) {
      await this.garantirNomeDisponivel(dto.nome, id);
    }
    return this.repositorio.save(this.repositorio.merge(categoria, dto));
  }

  async remover(id: number): Promise<void> {
    const categoria = await this.buscar(id);
    await this.repositorio.remove(categoria);
  }

  private async garantirNomeDisponivel(
    nome: string,
    idAtual?: number,
  ): Promise<void> {
    const existente = await this.repositorio.findOneBy({
      nome: Raw((coluna) => `LOWER(${coluna}) = LOWER(:nome)`, { nome }),
    });
    if (existente && existente.id !== idAtual) {
      throw new ConflictException(`Já existe uma categoria chamada "${nome}"`);
    }
  }
}
