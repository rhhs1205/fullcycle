import { Tarefa } from '../../tarefas/tarefa.entity';

export class PendentesPorPrioridadeDto {
  alta: number;
  media: number;
  baixa: number;
}

export class ResumoCategoriaDto {
  id: number | null;
  nome: string;
  cor: string | null;
  total: number;
  concluidas: number;
}

export class ResumoDto {
  total: number;
  concluidas: number;
  pendentes: number;
  percentualConcluido: number;
  pendentesPorPrioridade: PendentesPorPrioridadeDto;
  porCategoria: ResumoCategoriaDto[];
  proximas: Tarefa[];
}
