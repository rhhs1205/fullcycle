import { Categoria } from '../../categorias/data/categoria.model';

export const PRIORIDADES = ['alta', 'media', 'baixa'] as const;

export type Prioridade = (typeof PRIORIDADES)[number];

export const ROTULO_PRIORIDADE: Record<Prioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const PESO_PRIORIDADE: Record<Prioridade, number> = {
  alta: 3,
  media: 2,
  baixa: 1,
};

export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string | null;
  prioridade: Prioridade;
  concluida: boolean;
  categoriaId: number | null;
  categoria: Categoria | null;
  criadaEm: string;
  atualizadaEm: string;
}

export type DadosTarefa = Pick<
  Tarefa,
  'titulo' | 'descricao' | 'prioridade' | 'concluida' | 'categoriaId'
>;

export interface FiltroTarefas {
  categoriaId?: number;
  concluida?: boolean;
  prioridade?: Prioridade;
  busca?: string;
}

export function ehPrioridade(valor: unknown): valor is Prioridade {
  return typeof valor === 'string' && (PRIORIDADES as readonly string[]).includes(valor);
}
