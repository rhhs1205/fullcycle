import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Prioridade } from '../tarefas/prioridade';
import { Tarefa } from '../tarefas/tarefa.entity';
import {
  PendentesPorPrioridadeDto,
  ResumoCategoriaDto,
  ResumoDto,
} from './dto/resumo.dto';

interface LinhaPrioridade {
  prioridade: Prioridade;
  quantidade: number;
}

interface LinhaCategoria {
  id: number | null;
  nome: string | null;
  cor: string | null;
  total: number;
  concluidas: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefas: Repository<Tarefa>,
  ) {}

  async resumo(): Promise<ResumoDto> {
    const [total, concluidas, porPrioridade, porCategoria, proximas] =
      await Promise.all([
        this.tarefas.count(),
        this.tarefas.countBy({ concluida: true }),
        this.contarPendentesPorPrioridade(),
        this.contarPorCategoria(),
        this.buscarProximas(),
      ]);

    const pendentesPorPrioridade: PendentesPorPrioridadeDto = {
      alta: 0,
      media: 0,
      baixa: 0,
    };
    for (const linha of porPrioridade) {
      pendentesPorPrioridade[linha.prioridade] = linha.quantidade;
    }

    return {
      total,
      concluidas,
      pendentes: total - concluidas,
      percentualConcluido:
        total === 0 ? 0 : Math.round((concluidas / total) * 100),
      pendentesPorPrioridade,
      porCategoria: porCategoria.map((linha): ResumoCategoriaDto => ({
        id: linha.id,
        nome: linha.nome ?? 'Sem categoria',
        cor: linha.cor,
        total: linha.total,
        concluidas: linha.concluidas,
      })),
      proximas,
    };
  }

  private contarPendentesPorPrioridade(): Promise<LinhaPrioridade[]> {
    return this.tarefas
      .createQueryBuilder('tarefa')
      .select('tarefa.prioridade', 'prioridade')
      .addSelect('COUNT(*)::int', 'quantidade')
      .groupBy('tarefa.prioridade')
      .getRawMany<LinhaPrioridade>();
  }

  private contarPorCategoria(): Promise<LinhaCategoria[]> {
    return this.tarefas
      .createQueryBuilder('tarefa')
      .leftJoin('tarefa.categoria', 'categoria')
      .select('categoria.id', 'id')
      .addSelect('categoria.nome', 'nome')
      .addSelect('categoria.cor', 'cor')
      .addSelect('COUNT(tarefa.id)::int', 'total')
      .addSelect(
        '(COUNT(tarefa.id) FILTER (WHERE tarefa.concluida))::int',
        'concluidas',
      )
      .groupBy('categoria.id')
      .orderBy('total', 'DESC')
      .getRawMany<LinhaCategoria>();
  }

  private buscarProximas(): Promise<Tarefa[]> {
    return this.tarefas
      .createQueryBuilder('tarefa')
      .leftJoinAndSelect('tarefa.categoria', 'categoria')
      .where('tarefa.concluida = :concluida', { concluida: false })
      .orderBy(
        "CASE tarefa.prioridade WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END",
      )
      .addOrderBy('tarefa.criadaEm', 'DESC')
      .limit(5)
      .getMany();
  }
}
