import { LiveAnnouncer } from '@angular/cdk/a11y';
import { DOCUMENT, DatePipe } from '@angular/common';
import {
  Component,
  ElementRef,
  TrackByFunction,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subject, debounceTime, filter, map, switchMap } from 'rxjs';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { CabecalhoPagina } from '../../../shared/ui/cabecalho-pagina/cabecalho-pagina';
import {
  ConfirmacaoDialog,
  ConfirmacaoDialogData,
} from '../../../shared/ui/confirmacao-dialog/confirmacao-dialog';
import { EstadoErro } from '../../../shared/ui/estado-erro/estado-erro';
import { CategoriasStore } from '../../categorias/data/categorias.store';
import { ChipCategoria } from '../../categorias/ui/chip-categoria/chip-categoria';
import {
  FiltroTarefas,
  PESO_PRIORIDADE,
  PRIORIDADES,
  Tarefa,
  ehPrioridade,
} from '../data/tarefa.model';
import { TarefasStore } from '../data/tarefas.store';
import { TarefaFormDialog, TarefaFormDialogData } from '../tarefa-form-dialog/tarefa-form-dialog';
import { RotuloPrioridadePipe } from '../ui/rotulo-prioridade.pipe';
import { SeloPrioridade } from '../ui/selo-prioridade/selo-prioridade';

const ordemAlfabetica = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

interface FocoNaLinha {
  tarefa: number;
  posicao: number;
  acao: string;
}

function compararTarefas(a: Tarefa, b: Tarefa, coluna: string): number {
  switch (coluna) {
    case 'concluida':
      return Number(a.concluida) - Number(b.concluida);
    case 'titulo':
      return ordemAlfabetica.compare(a.titulo, b.titulo);
    case 'categoria':
      return ordemAlfabetica.compare(a.categoria?.nome ?? '', b.categoria?.nome ?? '');
    case 'prioridade':
      return PESO_PRIORIDADE[a.prioridade] - PESO_PRIORIDADE[b.prioridade];
    case 'criadaEm':
      return Date.parse(a.criadaEm) - Date.parse(b.criadaEm);
    default:
      return 0;
  }
}

@Component({
  selector: 'app-tarefas-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    CabecalhoPagina,
    EstadoErro,
    ChipCategoria,
    SeloPrioridade,
    RotuloPrioridadePipe,
  ],
  templateUrl: './tarefas-page.html',
  styleUrl: './tarefas-page.scss',
})
export class TarefasPage {
  readonly categoria = input<string>();
  readonly status = input<string>();
  readonly prioridade = input<string>();
  readonly busca = input<string>();

  protected readonly store = inject(TarefasStore);
  protected readonly categoriasStore = inject(CategoriasStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly documento = inject(DOCUMENT);
  private readonly anunciador = inject(LiveAnnouncer);
  private readonly sort = viewChild(MatSort);
  private readonly paginator = viewChild(MatPaginator);
  private readonly seletorCategoria = viewChild.required('seletorCategoria', { read: MatSelect });
  private readonly busca$ = new Subject<string>();

  protected readonly prioridades = PRIORIDADES;
  protected readonly colunas = [
    'concluida',
    'titulo',
    'categoria',
    'prioridade',
    'criadaEm',
    'acoes',
  ];
  protected readonly dataSource = new MatTableDataSource<Tarefa>([]);
  protected readonly rastrearPorId: TrackByFunction<Tarefa> = (_, tarefa) => tarefa.id;

  protected readonly filtro = computed<FiltroTarefas>(() => {
    const categoriaId = Number(this.categoria());
    const prioridade = this.prioridade();
    const status = this.status();
    return {
      categoriaId: Number.isInteger(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
      concluida: status === 'concluidas' ? true : status === 'pendentes' ? false : undefined,
      prioridade: ehPrioridade(prioridade) ? prioridade : undefined,
      busca: this.busca()?.trim() || undefined,
    };
  });

  protected readonly statusSelecionado = computed(() => {
    const concluida = this.filtro().concluida;
    return concluida === undefined ? null : concluida ? 'concluidas' : 'pendentes';
  });

  protected readonly filtrando = computed(() =>
    Object.values(this.filtro()).some((valor) => valor !== undefined),
  );

  constructor() {
    this.dataSource.sortData = (tarefas, sort) => {
      if (!sort.active || sort.direction === '') {
        return tarefas;
      }
      const sentido = sort.direction === 'asc' ? 1 : -1;
      return tarefas.sort((a, b) => sentido * compararTarefas(a, b, sort.active));
    };

    effect(() => {
      const tarefas = this.store.tarefas();
      untracked(() => this.exibir(tarefas));
    });

    effect(() => {
      this.dataSource.sort = this.sort() ?? null;
      this.dataSource.paginator = this.paginator() ?? null;
    });

    effect(() => {
      const filtro = this.filtro();
      untracked(() => {
        this.paginator()?.firstPage();
        this.store.carregar(filtro);
        this.carregarCategoriasSeFalharam();
      });
    });

    this.busca$
      .pipe(
        debounceTime(300),
        map((texto) => texto.trim()),
        filter((busca) => busca !== (this.filtro().busca ?? '')),
        takeUntilDestroyed(),
      )
      .subscribe((busca) => this.filtrar({ busca: busca || null }, true));

    this.categoriasStore.carregar();
  }

  protected recarregar(): void {
    this.store.carregar();
    this.categoriasStore.carregar();
  }

  protected tentarCategoriasDeNovo(): void {
    this.seletorCategoria().focus();
    this.categoriasStore.carregar();
  }

  protected digitarBusca(evento: Event): void {
    this.busca$.next((evento.target as HTMLInputElement).value);
  }

  protected filtrar(parametros: Params, substituirHistorico = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: parametros,
      queryParamsHandling: 'merge',
      replaceUrl: substituirHistorico,
    });
  }

  protected limparFiltros(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  protected abrirFormulario(tarefa?: Tarefa): void {
    const origem = this.focoNaLinha();
    this.carregarCategoriasSeFalharam();
    this.dialog
      .open<TarefaFormDialog, TarefaFormDialogData, Tarefa>(TarefaFormDialog, {
        data: { tarefa, categoriaId: this.filtro().categoriaId },
        width: '560px',
        maxWidth: '95vw',
      })
      .afterClosed()
      .subscribe((salva) => {
        if (origem !== null && this.focoPerdido()) {
          this.devolverFoco(origem);
        }
        if (typeof salva === 'object' && salva !== null) {
          this.snackBar.open(tarefa ? 'Tarefa atualizada.' : 'Tarefa criada.', 'OK');
        }
      });
  }

  protected alternarConcluida(tarefa: Tarefa): void {
    this.store.alternarConcluida(tarefa).subscribe({
      next: ({ titulo, concluida }) =>
        void this.anunciador.announce(`Tarefa ${concluida ? 'concluída' : 'reaberta'}: ${titulo}`),
      error: (erro: ErroApi) => this.snackBar.open(erro.mensagem, 'OK'),
    });
  }

  protected confirmarRemocao(tarefa: Tarefa): void {
    this.dialog
      .open<ConfirmacaoDialog, ConfirmacaoDialogData, boolean>(ConfirmacaoDialog, {
        data: {
          titulo: 'Excluir tarefa',
          mensagem: `Excluir "${tarefa.titulo}"? Essa ação não pode ser desfeita.`,
          confirmar: 'Excluir',
        },
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.store.remover(tarefa.id)),
      )
      .subscribe({
        next: () => this.snackBar.open('Tarefa excluída.', 'OK'),
        error: (erro: ErroApi) => this.snackBar.open(erro.mensagem, 'OK'),
      });
  }

  private carregarCategoriasSeFalharam(): void {
    if (this.categoriasStore.erro()) {
      this.categoriasStore.carregar();
    }
  }

  private exibir(tarefas: Tarefa[]): void {
    const foco = this.focoNaLinha();
    this.dataSource.data = tarefas;
    if (foco !== null) {
      this.devolverFoco(foco);
    }
  }

  private focoNaLinha(): FocoNaLinha | null {
    const controle = this.documento.activeElement?.closest<HTMLElement>('[data-acao]');
    const linha = controle?.closest<HTMLElement>('tr[data-tarefa]');
    return controle && linha
      ? {
          tarefa: Number(linha.dataset['tarefa']),
          posicao: this.linhas().indexOf(linha),
          acao: controle.dataset['acao'] ?? '',
        }
      : null;
  }

  private focoPerdido(): boolean {
    const ativo = this.documento.activeElement;
    return ativo === null || ativo === this.documento.body;
  }

  private devolverFoco({ tarefa, posicao, acao }: FocoNaLinha): void {
    const linhas = this.linhas();
    const linha =
      linhas.find((item) => item.dataset['tarefa'] === String(tarefa)) ??
      linhas[Math.min(posicao, linhas.length - 1)];
    const controle = linha?.querySelector<HTMLElement>(`[data-acao="${acao}"]`);
    const alvo =
      controle?.querySelector<HTMLElement>('input') ??
      controle ??
      this.elemento.nativeElement.querySelector<HTMLElement>('table');
    alvo?.focus();
  }

  private linhas(): HTMLElement[] {
    return Array.from(this.elemento.nativeElement.querySelectorAll<HTMLElement>('tr[mat-row]'));
  }
}
