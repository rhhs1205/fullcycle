import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CarregamentoService } from '../services/carregamento.service';
import { carregamentoInterceptor, semCarregamento } from './carregamento.interceptor';

describe('carregamentoInterceptor', () => {
  let http: HttpClient;
  let controle: HttpTestingController;
  let carregamento: CarregamentoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([carregamentoInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controle = TestBed.inject(HttpTestingController);
    carregamento = TestBed.inject(CarregamentoService);
  });

  afterEach(() => controle.verify());

  it('fica ativo enquanto há requisições em andamento', () => {
    http.get('/a').subscribe();
    http.get('/b').subscribe();
    expect(carregamento.ativo()).toBeTrue();

    controle.expectOne('/a').flush({});
    expect(carregamento.ativo()).toBeTrue();

    controle.expectOne('/b').flush({});
    expect(carregamento.ativo()).toBeFalse();
  });

  it('ignora requisições marcadas para rodar em segundo plano', () => {
    http.get('/health', { context: semCarregamento() }).subscribe();

    expect(carregamento.ativo()).toBeFalse();
    controle.expectOne('/health').flush({});
  });
});
