export interface Categoria {
  id: number;
  nome: string;
  cor: string;
  criadaEm: string;
  atualizadaEm: string;
}

export interface CategoriaComTotal extends Categoria {
  totalTarefas: number;
}

export type DadosCategoria = Pick<Categoria, 'nome' | 'cor'>;

export interface CorCategoria {
  valor: string;
  nome: string;
}

export const CORES_CATEGORIA: readonly CorCategoria[] = [
  { valor: '#1e88e5', nome: 'Azul' },
  { valor: '#43a047', nome: 'Verde' },
  { valor: '#e53935', nome: 'Vermelho' },
  { valor: '#fb8c00', nome: 'Laranja' },
  { valor: '#8e24aa', nome: 'Roxo' },
  { valor: '#00897b', nome: 'Verde-azulado' },
  { valor: '#6d4c41', nome: 'Marrom' },
  { valor: '#546e7a', nome: 'Cinza' },
];
