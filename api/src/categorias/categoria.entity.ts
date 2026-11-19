import { ApiHideProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany } from 'typeorm';
import { EntidadeBase } from '../common/entidade-base';
import { Tarefa } from '../tarefas/tarefa.entity';

@Entity()
export class Categoria extends EntidadeBase {
  @Column({ length: 60, unique: true })
  nome: string;

  @Column({ type: 'varchar', length: 7, default: '#1e88e5' })
  cor: string;

  @ApiHideProperty()
  @OneToMany(() => Tarefa, (tarefa) => tarefa.categoria)
  tarefas?: Tarefa[];
}
