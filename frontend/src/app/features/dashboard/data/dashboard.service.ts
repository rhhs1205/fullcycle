import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Resumo } from './resumo.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  resumo(): Observable<Resumo> {
    return this.http.get<Resumo>(`${environment.apiUrl}/dashboard/resumo`);
  }
}
