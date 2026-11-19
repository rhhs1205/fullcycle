import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { CategoriasStore } from '../../categorias/data/categorias.store';
import { ChipCategoria } from '../../categorias/ui/chip-categoria/chip-categoria';
import { PRIORIDADES, Prioridade, Tarefa } from '../data/tarefa.model';
import { TarefasStore } from '../data/tarefas.store';
import { RotuloPrioridadePipe } from '../ui/rotulo-prioridade.pipe';

export interface TarefaFormDialogData {
  tarefa?: Tarefa;
  categoriaId?: number;
}

@Component({
  selector: 'app-tarefa-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    ChipCategoria,
    RotuloPrioridadePipe,
  ],
  templateUrl: './tarefa-form-dialog.html',
  styleUrl: './tarefa-form-dialog.scss',
})
export class TarefaFormDialog {
  private readonly store = inject(TarefasStore);
  private readonly dialogRef = inject<MatDialogRef<TarefaFormDialog, Tarefa>>(MatDialogRef);
  private readonly data = inject<TarefaFormDialogData>(MAT_DIALOG_DATA);
  private readonly tarefa = this.data.tarefa;

  protected readonly categorias = inject(CategoriasStore).categorias;
  protected readonly editando = this.tarefa !== undefined;
  protected readonly prioridades = PRIORIDADES;
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    titulo: [
      this.tarefa?.titulo ?? '',
      [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)],
    ],
    descricao: [this.tarefa?.descricao ?? '', Validators.maxLength(500)],
    prioridade: [this.tarefa?.prioridade ?? ('media' as Prioridade), Validators.required],
    categoriaId: [this.tarefa?.categoriaId ?? this.data.categoriaId ?? (null as number | null)],
    concluida: [false],
  });

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);
    this.store
      .salvar(
        {
          titulo: valores.titulo.trim(),
          descricao: valores.descricao.trim() || null,
          prioridade: valores.prioridade,
          categoriaId: valores.categoriaId,
          concluida: valores.concluida,
        },
        this.tarefa?.id,
      )
      .subscribe({
        next: (tarefa) => this.dialogRef.close(tarefa),
        error: (erro: ErroApi) => {
          this.salvando.set(false);
          this.erro.set(erro.mensagem);
        },
      });
  }
}
