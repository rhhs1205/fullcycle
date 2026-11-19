import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface ErroApi {
  status: number;
  mensagem: string;
}

const MENSAGEM_PADRAO = 'Algo deu errado. Tente de novo em instantes.';

export function paraErroApi(erro: unknown): ErroApi {
  if (!(erro instanceof HttpErrorResponse)) {
    return { status: -1, mensagem: MENSAGEM_PADRAO };
  }
  if (erro.status === 0) {
    return {
      status: 0,
      mensagem: 'Não foi possível falar com a API. Tente de novo em instantes.',
    };
  }
  if (erro.status >= 500) {
    return {
      status: erro.status,
      mensagem: 'A API encontrou um problema. Tente de novo em instantes.',
    };
  }
  const corpo = erro.error as { message?: string | string[] } | null;
  const mensagem = corpo?.message;
  const texto = Array.isArray(mensagem) ? mensagem.join('. ') : mensagem;
  return { status: erro.status, mensagem: texto || MENSAGEM_PADRAO };
}

export const erroInterceptor: HttpInterceptorFn = (requisicao, proximo) =>
  proximo(requisicao).pipe(catchError((erro: unknown) => throwError(() => paraErroApi(erro))));
