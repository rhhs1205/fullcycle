import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Categoria } from '../categorias/categoria.entity';
import { EntidadeBase } from '../common/entidade-base';
import { PRIORIDADES } from './prioridade';
import type { Prioridade } from './prioridade';

@Entity()
export class Tarefa extends EntidadeBase {
  @Column({ length: 120 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descricao: string | null;

  @ApiProperty({ enum: PRIORIDADES })
  @Column({ type: 'varchar', length: 10, default: 'media' })
  prioridade: Prioridade;

  @Column({ default: false })
  concluida: boolean;

  @ApiProperty({ type: 'integer', nullable: true, example: 1 })
  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => Categoria, (categoria) => categoria.tarefas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria?: Categoria | null;
}
