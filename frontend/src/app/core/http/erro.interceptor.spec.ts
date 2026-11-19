import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErroApi, erroInterceptor } from './erro.interceptor';

describe('erroInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let recebido: ErroApi | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    recebido = undefined;
    http.get('/qualquer').subscribe({ error: (erro: ErroApi) => (recebido = erro) });
  });

  afterEach(() => controle.verify());

  it('usa a mensagem enviada pela API', () => {
    controle
      .expectOne('/qualquer')
      .flush(
        { message: 'Já existe uma categoria chamada "Estudos"' },
        { status: 409, statusText: 'Conflict' },
      );

    expect(recebido).toEqual({
      status: 409,
      mensagem: 'Já existe uma categoria chamada "Estudos"',
    });
  });

  it('junta as mensagens de validação', () => {
    controle
      .expectOne('/qualquer')
      .flush(
        { message: ['titulo should not be empty', 'prioridade must be one of'] },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(recebido?.mensagem).toBe('titulo should not be empty. prioridade must be one of');
  });

  it('avisa quando a API está fora do ar', () => {
    controle.expectOne('/qualquer').error(new ProgressEvent('error'));

    expect(recebido).toEqual({
      status: 0,
      mensagem: 'Não foi possível falar com a API. Tente de novo em instantes.',
    });
  });

  it('esconde detalhes de erros internos da API', () => {
    controle
      .expectOne('/qualquer')
      .flush({ message: 'Internal server error' }, { status: 500, statusText: 'Error' });

    expect(recebido?.mensagem).toBe('A API encontrou um problema. Tente de novo em instantes.');
  });
});
