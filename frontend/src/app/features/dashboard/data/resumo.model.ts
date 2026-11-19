import { Prioridade, Tarefa } from '../../tarefas/data/tarefa.model';

export interface ResumoCategoria {
  id: number | null;
  nome: string;
  cor: string | null;
  total: number;
  concluidas: number;
}

export interface Resumo {
  total: number;
  concluidas: number;
  pendentes: number;
  percentualConcluido: number;
  pendentesPorPrioridade: Record<Prioridade, number>;
  porCategoria: ResumoCategoria[];
  proximas: Tarefa[];
}
