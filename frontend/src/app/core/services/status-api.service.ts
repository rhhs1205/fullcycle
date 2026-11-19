import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, merge, of, startWith, switchMap, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { semCarregamento } from '../http/carregamento.interceptor';
import { ErroApi } from '../http/erro.interceptor';

export type StatusApi = 'verificando' | 'online' | 'offline' | 'banco-offline';

const INTERVALO_MS = 30_000;

const apiRespondeu = (erro: ErroApi): boolean => erro.status > 0;

@Injectable({ providedIn: 'root' })
export class StatusApiService {
  private readonly http = inject(HttpClient);
  private readonly verificarAgora$ = new Subject<void>();

  readonly status = toSignal(
    merge(
      timer(0, INTERVALO_MS).pipe(map(() => false)),
      this.verificarAgora$.pipe(map(() => true)),
    ).pipe(
      switchMap((manual) =>
        manual ? this.consultar().pipe(startWith<StatusApi>('verificando')) : this.consultar(),
      ),
    ),
    { initialValue: 'verificando' },
  );

  verificar(): void {
    this.verificarAgora$.next();
  }

  private consultar(): Observable<StatusApi> {
    return this.http.get(`${environment.apiUrl}/health`, { context: semCarregamento() }).pipe(
      map((): StatusApi => 'online'),
      catchError((erro: ErroApi) =>
        of<StatusApi>(apiRespondeu(erro) ? 'banco-offline' : 'offline'),
      ),
    );
  }
}
