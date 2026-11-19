import { I18nPluralPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { filter, switchMap } from 'rxjs';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { CabecalhoPagina } from '../../../shared/ui/cabecalho-pagina/cabecalho-pagina';
import {
  ConfirmacaoDialog,
  ConfirmacaoDialogData,
} from '../../../shared/ui/confirmacao-dialog/confirmacao-dialog';
import { EstadoErro } from '../../../shared/ui/estado-erro/estado-erro';
import { EstadoVazio } from '../../../shared/ui/estado-vazio/estado-vazio';
import {
  CategoriaFormDialog,
  CategoriaFormDialogData,
} from '../categoria-form-dialog/categoria-form-dialog';
import { Categoria, CategoriaComTotal } from '../data/categoria.model';
import { CategoriasStore } from '../data/categorias.store';

function avisoSobreTarefas(total: number): string {
  if (total === 0) {
    return '';
  }
  if (total === 1) {
    return ' A única tarefa dela vai ficar sem categoria.';
  }
  return ` As ${total} tarefas dela vão ficar sem categoria.`;
}

@Component({
  selector: 'app-categorias-page',
  imports: [
    I18nPluralPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    CabecalhoPagina,
    EstadoErro,
    EstadoVazio,
  ],
  templateUrl: './categorias-page.html',
  styleUrl: './categorias-page.scss',
})
export class CategoriasPage {
  protected readonly store = inject(CategoriasStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly pluralTarefas = {
    '=0': 'Nenhuma tarefa',
    '=1': '1 tarefa',
    other: '# tarefas',
  };

  constructor() {
    this.store.carregar();
  }

  protected abrirFormulario(categoria?: Categoria): void {
    this.dialog
      .open<CategoriaFormDialog, CategoriaFormDialogData, Categoria>(CategoriaFormDialog, {
        data: { categoria },
        width: '480px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .pipe(filter((salva) => typeof salva === 'object' && salva !== null))
      .subscribe(() =>
        this.snackBar.open(categoria ? 'Categoria atualizada.' : 'Categoria criada.', 'OK'),
      );
  }

  protected confirmarRemocao(categoria: CategoriaComTotal): void {
    this.dialog
      .open<ConfirmacaoDialog, ConfirmacaoDialogData, boolean>(ConfirmacaoDialog, {
        data: {
          titulo: 'Excluir categoria',
          mensagem: `Excluir "${categoria.nome}"?${avisoSobreTarefas(categoria.totalTarefas)}`,
          confirmar: 'Excluir',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.remover(categoria.id)),
      )
      .subscribe({
        next: () => this.snackBar.open('Categoria excluída.', 'OK'),
        error: (erro: ErroApi) => this.snackBar.open(erro.mensagem, 'OK'),
      });
  }
}
