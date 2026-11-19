import { Component, ElementRef, inject, signal, viewChildren } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { CORES_CATEGORIA, Categoria } from '../data/categoria.model';
import { CategoriasStore } from '../data/categorias.store';
import { ChipCategoria } from '../ui/chip-categoria/chip-categoria';

export interface CategoriaFormDialogData {
  categoria?: Categoria;
}

const PASSO_POR_TECLA: Partial<Record<string, number>> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

@Component({
  selector: 'app-categoria-form-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    ChipCategoria,
  ],
  templateUrl: './categoria-form-dialog.html',
  styleUrl: './categoria-form-dialog.scss',
})
export class CategoriaFormDialog {
  private readonly store = inject(CategoriasStore);
  private readonly dialogRef = inject<MatDialogRef<CategoriaFormDialog, Categoria>>(MatDialogRef);
  private readonly categoria = inject<CategoriaFormDialogData>(MAT_DIALOG_DATA).categoria;
  private readonly amostras = viewChildren<ElementRef<HTMLButtonElement>>('amostra');

  protected readonly editando = this.categoria !== undefined;
  protected readonly cores = CORES_CATEGORIA;
  protected readonly salvando = signal(false);
  protected readonly erro = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    nome: [
      this.categoria?.nome ?? '',
      [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)],
    ],
    cor: [this.categoria?.cor ?? CORES_CATEGORIA[0].valor, Validators.required],
  });

  protected escolherCor(cor: string): void {
    this.form.controls.cor.setValue(cor);
  }

  protected indiceFocavel(): number {
    return Math.max(
      0,
      this.cores.findIndex((cor) => cor.valor === this.form.controls.cor.value),
    );
  }

  protected navegarPelasCores(evento: KeyboardEvent, indice: number): void {
    const passo = PASSO_POR_TECLA[evento.key];
    if (passo === undefined) {
      return;
    }
    evento.preventDefault();
    const proximo = (indice + passo + this.cores.length) % this.cores.length;
    this.escolherCor(this.cores[proximo].valor);
    this.amostras()[proximo].nativeElement.focus();
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nome, cor } = this.form.getRawValue();
    this.salvando.set(true);
    this.erro.set(null);
    this.store.salvar({ nome: nome.trim(), cor }, this.categoria?.id).subscribe({
      next: (categoria) => this.dialogRef.close(categoria),
      error: (erro: ErroApi) => {
        this.salvando.set(false);
        this.erro.set(erro.mensagem);
      },
    });
  }
}
