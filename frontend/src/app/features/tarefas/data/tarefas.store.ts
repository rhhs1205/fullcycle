import { Injectable, computed, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, switchMap, tap } from 'rxjs';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { DadosTarefa, FiltroTarefas, Tarefa } from './tarefa.model';
import { TarefasService } from './tarefas.service';

interface EstadoTarefas {
  tarefas: Tarefa[];
  filtro: FiltroTarefas;
  carregando: boolean;
  erro: string | null;
}

@Injectable({ providedIn: 'root' })
export class TarefasStore {
  private readonly service = inject(TarefasService);
  private readonly recarregar$ = new Subject<FiltroTarefas>();
  private readonly estado = signal<EstadoTarefas>({
    tarefas: [],
    filtro: {},
    carregando: false,
    erro: null,
  });

  readonly tarefas = computed(() => this.estado().tarefas);
  readonly filtro = computed(() => this.estado().filtro);
  readonly carregando = computed(() => this.estado().carregando);
  readonly erro = computed(() => this.estado().erro);
  readonly pendentes = computed(() => this.tarefas().filter((tarefa) => !tarefa.concluida).length);

  constructor() {
    this.recarregar$
      .pipe(
        tap((filtro) => this.atualizarEstado({ filtro, carregando: true, erro: null })),
        switchMap((filtro) =>
          this.service.listar(filtro).pipe(
            tap((tarefas) => this.atualizarEstado({ tarefas, carregando: false })),
            catchError((erro: ErroApi) => {
              this.atualizarEstado({ carregando: false, erro: erro.mensagem });
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  carregar(filtro: FiltroTarefas = untracked(this.filtro)): void {
    this.recarregar$.next(filtro);
  }

  salvar(dados: DadosTarefa, id?: number): Observable<Tarefa> {
    const requisicao =
      id === undefined ? this.service.criar(dados) : this.service.atualizar(id, dados);
    return requisicao.pipe(tap(() => this.carregar()));
  }

  alternarConcluida(tarefa: Tarefa): Observable<Tarefa> {
    const concluida = !tarefa.concluida;
    this.substituir({ ...tarefa, concluida });
    return this.service.atualizar(tarefa.id, { concluida }).pipe(
      tap({
        next: () => this.carregar(),
        error: () => this.substituir(tarefa),
      }),
    );
  }

  remover(id: number): Observable<void> {
    return this.service.remover(id);
  }

  private substituir(tarefa: Tarefa): void {
    this.atualizarEstado({
      tarefas: untracked(this.tarefas).map((atual) => (atual.id === tarefa.id ? tarefa : atual)),
    });
  }

  private atualizarEstado(parcial: Partial<EstadoTarefas>): void {
    this.estado.update((estado) => ({ ...estado, ...parcial }));
  }
}
