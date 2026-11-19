import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { DadosTarefa } from './tarefa.model';
import { TarefasService } from './tarefas.service';

describe('TarefasService', () => {
  const url = `${environment.apiUrl}/tarefas`;
  let service: TarefasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TarefasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista sem filtros', () => {
    service.listar().subscribe();

    const requisicao = http.expectOne(url);
    expect(requisicao.request.method).toBe('GET');
    expect(requisicao.request.params.keys()).toEqual([]);
    requisicao.flush([]);
  });

  it('envia só os filtros preenchidos na query string', () => {
    service
      .listar({ categoriaId: 2, concluida: false, prioridade: undefined, busca: 'docker' })
      .subscribe();

    const requisicao = http.expectOne((r) => r.url === url);
    expect(requisicao.request.params.get('categoriaId')).toBe('2');
    expect(requisicao.request.params.get('concluida')).toBe('false');
    expect(requisicao.request.params.get('busca')).toBe('docker');
    expect(requisicao.request.params.has('prioridade')).toBeFalse();
    requisicao.flush([]);
  });

  it('cria com POST', () => {
    const dados: DadosTarefa = {
      titulo: 'Estudar Angular',
      descricao: null,
      prioridade: 'alta',
      concluida: false,
      categoriaId: 1,
    };

    service.criar(dados).subscribe();

    const requisicao = http.expectOne(url);
    expect(requisicao.request.method).toBe('POST');
    expect(requisicao.request.body).toEqual(dados);
    requisicao.flush({});
  });

  it('atualiza com PATCH e remove com DELETE', () => {
    service.atualizar(1, { concluida: true }).subscribe();
    service.remover(1).subscribe();

    const requisicoes = http.match(`${url}/1`);
    expect(requisicoes.map((r) => r.request.method)).toEqual(['PATCH', 'DELETE']);
    requisicoes.forEach((r) => r.flush(null));
  });
});
