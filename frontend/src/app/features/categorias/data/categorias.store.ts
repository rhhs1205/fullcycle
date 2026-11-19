import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, Subject, catchError, switchMap, tap } from 'rxjs';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { Categoria, CategoriaComTotal, DadosCategoria } from './categoria.model';
import { CategoriasService } from './categorias.service';

interface EstadoCategorias {
  categorias: CategoriaComTotal[];
  carregando: boolean;
  erro: string | null;
}

@Injectable({ providedIn: 'root' })
export class CategoriasStore {
  private readonly service = inject(CategoriasService);
  private readonly recarregar$ = new Subject<void>();
  private readonly estado = signal<EstadoCategorias>({
    categorias: [],
    carregando: false,
    erro: null,
  });

  readonly categorias = computed(() => this.estado().categorias);
  readonly carregando = computed(() => this.estado().carregando);
  readonly erro = computed(() => this.estado().erro);

  constructor() {
    this.recarregar$
      .pipe(
        tap(() => this.atualizarEstado({ carregando: true, erro: null })),
        switchMap(() =>
          this.service.listar().pipe(
            tap((categorias) => this.atualizarEstado({ categorias, carregando: false })),
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

  carregar(): void {
    this.recarregar$.next();
  }

  salvar(dados: DadosCategoria, id?: number): Observable<Categoria> {
    const requisicao =
      id === undefined ? this.service.criar(dados) : this.service.atualizar(id, dados);
    return requisicao.pipe(tap(() => this.carregar()));
  }

  remover(id: number): Observable<void> {
    return this.service.remover(id).pipe(tap(() => this.carregar()));
  }

  private atualizarEstado(parcial: Partial<EstadoCategorias>): void {
    this.estado.update((estado) => ({ ...estado, ...parcial }));
  }
}
