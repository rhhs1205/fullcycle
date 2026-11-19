import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { Tarefa } from './tarefa.model';
import { TarefasService } from './tarefas.service';
import { TarefasStore } from './tarefas.store';

const novaTarefa = (dados: Partial<Tarefa> = {}): Tarefa => ({
  id: 1,
  titulo: 'Tarefa',
  descricao: null,
  prioridade: 'media',
  concluida: false,
  categoriaId: null,
  categoria: null,
  criadaEm: '2026-01-01T10:00:00.000Z',
  atualizadaEm: '2026-01-01T10:00:00.000Z',
  ...dados,
});

describe('TarefasStore', () => {
  let service: jasmine.SpyObj<TarefasService>;
  let store: TarefasStore;

  beforeEach(() => {
    service = jasmine.createSpyObj<TarefasService>('TarefasService', [
      'listar',
      'criar',
      'atualizar',
      'remover',
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: TarefasService, useValue: service }],
    });
    store = TestBed.inject(TarefasStore);
  });

  it('carrega as tarefas com o filtro pedido', () => {
    const tarefas = [novaTarefa()];
    service.listar.and.returnValue(of(tarefas));

    store.carregar({ concluida: false });

    expect(service.listar).toHaveBeenCalledWith({ concluida: false });
    expect(store.tarefas()).toEqual(tarefas);
    expect(store.filtro()).toEqual({ concluida: false });
    expect(store.carregando()).toBeFalse();
  });

  it('guarda a mensagem quando a API falha', () => {
    const erro: ErroApi = { status: 0, mensagem: 'API fora. Tente de novo em instantes.' };
    service.listar.and.returnValue(throwError(() => erro));

    store.carregar();

    expect(store.erro()).toBe(erro.mensagem);
    expect(store.carregando()).toBeFalse();
  });

  it('marca como concluída antes da resposta e desfaz se a API falhar', () => {
    const tarefa = novaTarefa();
    const resposta = new Subject<Tarefa>();
    service.listar.and.returnValue(of([tarefa]));
    service.atualizar.and.returnValue(resposta);
    store.carregar();

    store.alternarConcluida(tarefa).subscribe({ error: () => undefined });
    expect(store.tarefas()[0].concluida).toBeTrue();

    resposta.error({ status: 0, mensagem: 'falhou' });
    expect(store.tarefas()[0].concluida).toBeFalse();
  });

  it('recarrega a lista depois de salvar', () => {
    service.listar.and.returnValue(of([]));
    service.criar.and.returnValue(of(novaTarefa()));

    store
      .salvar({
        titulo: 'Nova',
        descricao: null,
        prioridade: 'alta',
        concluida: false,
        categoriaId: null,
      })
      .subscribe();

    expect(service.criar).toHaveBeenCalled();
    expect(service.listar).toHaveBeenCalledTimes(1);
  });
});
