import { Categoria } from '../categoria.entity';

export class CategoriaComTotalDto extends Categoria {
  totalTarefas: number;
}
