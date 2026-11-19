import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Categoria, CategoriaComTotal, DadosCategoria } from './categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/categorias`;

  listar(): Observable<CategoriaComTotal[]> {
    return this.http.get<CategoriaComTotal[]>(this.url);
  }

  criar(dados: DadosCategoria): Observable<Categoria> {
    return this.http.post<Categoria>(this.url, dados);
  }

  atualizar(id: number, dados: Partial<DadosCategoria>): Observable<Categoria> {
    return this.http.patch<Categoria>(`${this.url}/${id}`, dados);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
