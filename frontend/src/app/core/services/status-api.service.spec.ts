import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { erroInterceptor } from '../http/erro.interceptor';
import { StatusApiService } from './status-api.service';

const comRelogioFalso = (teste: () => void) =>
  fakeAsync(
    () => {
      teste();
      discardPeriodicTasks();
    },
    { flush: false },
  );

describe('StatusApiService', () => {
  const url = `${environment.apiUrl}/health`;
  const bancoIndisponivel = { status: 503, statusText: 'Service Unavailable' };
  let controle: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([erroInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    controle = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controle.verify());

  const iniciar = (): StatusApiService => {
    const service = TestBed.inject(StatusApiService);
    tick();
    return service;
  };

  it(
    'começa verificando a API',
    comRelogioFalso(() => {
      const service = TestBed.inject(StatusApiService);

      expect(service.status()).toBe('verificando');

      tick();
      controle.expectOne(url).flush({ status: 'ok', banco: 'ok' });
    }),
  );

  it(
    'fica online quando o /health responde 200',
    comRelogioFalso(() => {
      const service = iniciar();

      controle.expectOne(url).flush({ status: 'ok', banco: 'ok' });

      expect(service.status()).toBe('online');
    }),
  );

  it(
    'avisa que só o banco caiu quando o /health responde 503',
    comRelogioFalso(() => {
      const service = iniciar();

      controle.expectOne(url).flush({ status: 'erro', banco: 'indisponível' }, bancoIndisponivel);

      expect(service.status()).toBe('banco-offline');
    }),
  );

  it(
    'fica offline quando a API não responde',
    comRelogioFalso(() => {
      const service = iniciar();

      controle.expectOne(url).error(new ProgressEvent('error'));

      expect(service.status()).toBe('offline');
    }),
  );

  it(
    'consulta o /health de novo a cada 30 segundos',
    comRelogioFalso(() => {
      const service = iniciar();
      controle.expectOne(url).flush({ status: 'ok', banco: 'ok' });

      tick(29_999);
      controle.expectNone(url);
      tick(1);
      controle.expectOne(url).flush({ status: 'erro', banco: 'indisponível' }, bancoIndisponivel);

      expect(service.status()).toBe('banco-offline');
    }),
  );

  it(
    'mostra que está verificando quando a consulta é pedida na hora',
    comRelogioFalso(() => {
      const service = iniciar();
      controle.expectOne(url).error(new ProgressEvent('error'));

      service.verificar();

      expect(service.status()).toBe('verificando');
      controle.expectOne(url).flush({ status: 'ok', banco: 'ok' });
      expect(service.status()).toBe('online');
    }),
  );
});
