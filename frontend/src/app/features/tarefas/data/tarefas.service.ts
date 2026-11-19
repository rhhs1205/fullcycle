import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DadosTarefa, FiltroTarefas, Tarefa } from './tarefa.model';

@Injectable({ providedIn: 'root' })
export class TarefasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/tarefas`;

  listar(filtro: FiltroTarefas = {}): Observable<Tarefa[]> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    }
    return this.http.get<Tarefa[]>(this.url, { params });
  }

  criar(dados: DadosTarefa): Observable<Tarefa> {
    return this.http.post<Tarefa>(this.url, dados);
  }

  atualizar(id: number, dados: Partial<DadosTarefa>): Observable<Tarefa> {
    return this.http.patch<Tarefa>(`${this.url}/${id}`, dados);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
