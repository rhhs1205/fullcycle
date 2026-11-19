import { HttpContext, HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { CarregamentoService } from '../services/carregamento.service';

export const IGNORAR_CARREGAMENTO = new HttpContextToken<boolean>(() => false);

export const semCarregamento = (): HttpContext => new HttpContext().set(IGNORAR_CARREGAMENTO, true);

export const carregamentoInterceptor: HttpInterceptorFn = (requisicao, proximo) => {
  if (requisicao.context.get(IGNORAR_CARREGAMENTO)) {
    return proximo(requisicao);
  }
  const carregamento = inject(CarregamentoService);
  carregamento.iniciar();
  return proximo(requisicao).pipe(finalize(() => carregamento.finalizar()));
};
