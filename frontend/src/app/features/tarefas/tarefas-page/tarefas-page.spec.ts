import { LiveAnnouncer } from '@angular/cdk/a11y';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';
import { Categoria, CategoriaComTotal } from '../../categorias/data/categoria.model';
import { CategoriasService } from '../../categorias/data/categorias.service';
import { FiltroTarefas, Tarefa } from '../data/tarefa.model';
import { TarefasService } from '../data/tarefas.service';
import { TarefasPage } from './tarefas-page';

const foraDoAr = (): Observable<never> =>
  throwError(() => ({
    status: 0,
    mensagem: 'Não foi possível falar com a API. Tente de novo em instantes.',
  }));

const estudos: CategoriaComTotal = {
  id: 3,
  nome: 'Estudos',
  cor: '#1e88e5',
  totalTarefas: 1,
  criadaEm: '',
  atualizadaEm: '',
};

const novaTarefa = (dados: Partial<Tarefa>): Tarefa => ({
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

const botao = (raiz: ParentNode, texto: string): HTMLButtonElement => {
  const encontrado = Array.from(raiz.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(texto),
  );
  if (!encontrado) {
    throw new Error(`Botão "${texto}" não encontrado`);
  }
  return encontrado;
};

describe('TarefasPage', () => {
  let listar: jasmine.Spy;
  let criar: jasmine.Spy;
  let atualizar: jasmine.Spy;
  let listarCategorias: jasmine.Spy;

  beforeEach(async () => {
    listar = jasmine.createSpy('listar').and.returnValue(of([]));
    criar = jasmine.createSpy('criar');
    atualizar = jasmine.createSpy('atualizar');
    listarCategorias = jasmine.createSpy('listarCategorias').and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [TarefasPage],
      providers: [
        provideRouter([]),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: TarefasService, useValue: { listar, criar, atualizar } },
        { provide: CategoriasService, useValue: { listar: listarCategorias } },
      ],
    }).compileComponents();
  });

  const estabilizar = async (fixture: ComponentFixture<TarefasPage>): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const montar = async (
    configurar?: (fixture: ComponentFixture<TarefasPage>) => void,
  ): Promise<ComponentFixture<TarefasPage>> => {
    const fixture = TestBed.createComponent(TarefasPage);
    configurar?.(fixture);
    await estabilizar(fixture);
    return fixture;
  };

  const renderizar = async (
    configurar?: (fixture: ComponentFixture<TarefasPage>) => void,
  ): Promise<HTMLElement> => (await montar(configurar)).nativeElement as HTMLElement;

  const sobreposicao = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();

  const titulos = (elemento: HTMLElement): string[] =>
    Array.from(elemento.querySelectorAll('tr.mat-mdc-row .titulo')).map(
      (item) => item.textContent?.trim() ?? '',
    );

  const ordenarPor = (fixture: ComponentFixture<TarefasPage>, coluna: string): void => {
    const cabecalho = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('th[mat-sort-header]'),
    ).find((item) => item.textContent?.includes(coluna));
    cabecalho?.click();
    fixture.detectChanges();
  };

  const seletor = (raiz: ParentNode, rotulo: string): HTMLElement | null | undefined =>
    Array.from(raiz.querySelectorAll('mat-form-field'))
      .find((campo) => campo.querySelector('mat-label')?.textContent?.trim() === rotulo)
      ?.querySelector<HTMLElement>('mat-select');

  const opcoesDoSeletor = async (
    fixture: ComponentFixture<TarefasPage>,
    raiz: ParentNode,
    rotulo: string,
  ): Promise<string[]> => {
    seletor(raiz, rotulo)?.querySelector<HTMLElement>('.mat-mdc-select-trigger')?.click();
    await estabilizar(fixture);
    return Array.from(sobreposicao().querySelectorAll('mat-option')).map(
      (opcao) => opcao.textContent?.trim() ?? '',
    );
  };

  it('mostra as tarefas com categoria e prioridade e risca as concluídas', async () => {
    listar.and.returnValue(
      of([
        novaTarefa({
          id: 1,
          titulo: 'Estudar Angular',
          prioridade: 'alta',
          categoriaId: 3,
          categoria: {
            id: 3,
            nome: 'Estudos',
            cor: '#1e88e5',
            criadaEm: '',
            atualizadaEm: '',
          },
        }),
        novaTarefa({ id: 2, titulo: 'Subir o banco', concluida: true }),
      ]),
    );

    const elemento = await renderizar();
    const linhas = elemento.querySelectorAll('tr.mat-mdc-row');

    expect(linhas.length).toBe(2);
    expect(linhas[0].textContent).toContain('Estudar Angular');
    expect(linhas[0].querySelector('app-chip-categoria')?.textContent).toContain('Estudos');
    expect(linhas[0].querySelector('app-selo-prioridade')?.textContent).toContain('Alta');
    expect(linhas[1].classList).toContain('concluida');
  });

  it('usa os filtros da URL na consulta à API', async () => {
    await renderizar((fixture) => {
      fixture.componentRef.setInput('categoria', '3');
      fixture.componentRef.setInput('status', 'pendentes');
      fixture.componentRef.setInput('prioridade', 'invalida');
    });

    expect(listar).toHaveBeenCalledWith(
      jasmine.objectContaining({ categoriaId: 3, concluida: false, prioridade: undefined }),
    );
  });

  it('não busca as categorias de novo ao filtrar ou abrir o formulário quando elas já carregaram', async () => {
    const fixture = await montar();
    listarCategorias.calls.reset();

    fixture.componentRef.setInput('status', 'pendentes');
    await estabilizar(fixture);
    botao(fixture.nativeElement, 'Nova tarefa').click();
    await estabilizar(fixture);

    expect(listar).toHaveBeenCalledWith(jasmine.objectContaining({ concluida: false }));
    expect(sobreposicao().querySelector('mat-dialog-container')).not.toBeNull();
    expect(listarCategorias).not.toHaveBeenCalled();
  });

  it('mostra o estado vazio quando não há tarefas', async () => {
    const elemento = await renderizar();

    expect(elemento.textContent).toContain('Nenhuma tarefa ainda');
  });

  it('pede para tentar de novo quando a API está fora', async () => {
    listar.and.returnValue(
      throwError(() => ({
        status: 0,
        mensagem: 'Não foi possível falar com a API. Tente de novo em instantes.',
      })),
    );

    const elemento = await renderizar();

    expect(elemento.textContent).toContain('Tente de novo em instantes');
    expect(elemento.querySelector('table')).toBeNull();
  });

  it('limita a busca a 120 caracteres, como a API', async () => {
    const elemento = await renderizar();

    expect(elemento.querySelector<HTMLInputElement>('.busca input')?.maxLength).toBe(120);
  });

  describe('quando a API falha', () => {
    beforeEach(() => {
      listar.and.returnValue(
        throwError(() => ({ status: 400, mensagem: 'busca must be shorter than 120 characters' })),
      );
    });

    it('troca só a tabela pelo erro e mantém a busca e os filtros utilizáveis', async () => {
      const elemento = await renderizar((fixture) =>
        fixture.componentRef.setInput('busca', 'docker'),
      );

      expect(elemento.textContent).toContain('busca must be shorter than 120 characters');
      expect(elemento.querySelector('table')).toBeNull();
      expect(elemento.querySelector('mat-paginator')).toBeNull();
      expect(elemento.querySelector<HTMLInputElement>('.busca input')?.value).toBe('docker');
      expect(elemento.querySelectorAll('.filtros mat-select').length).toBe(3);
      expect(botao(elemento, 'Limpar filtros')).toBeTruthy();
    });

    it('recarrega as tarefas e as categorias ao tentar de novo', async () => {
      const fixture = await montar();
      listar.calls.reset();
      listarCategorias.calls.reset();
      listar.and.returnValue(of([novaTarefa({ titulo: 'Voltou' })]));

      botao(fixture.nativeElement, 'Tentar de novo').click();
      await estabilizar(fixture);

      expect(listar).toHaveBeenCalledTimes(1);
      expect(listarCategorias).toHaveBeenCalledTimes(1);
      expect(fixture.nativeElement.querySelector('tr.mat-mdc-row')?.textContent).toContain(
        'Voltou',
      );
    });
  });

  describe('quando as categorias falham', () => {
    const voltarApi = (): void => {
      listar.and.returnValue(of([novaTarefa({ titulo: 'Estudar Docker' })]));
      listarCategorias.and.returnValue(of([estudos]));
    };

    beforeEach(() => {
      listar.and.callFake(foraDoAr);
      listarCategorias.and.callFake(foraDoAr);
    });

    it('traz as categorias de volta quando o aluno sai do erro pelo filtro de status', async () => {
      const fixture = await montar();
      expect(fixture.nativeElement.textContent).toContain('Não foi possível falar com a API');

      voltarApi();
      fixture.componentRef.setInput('status', 'pendentes');
      await estabilizar(fixture);

      expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
      expect(await opcoesDoSeletor(fixture, fixture.nativeElement, 'Categoria')).toEqual([
        'Todas',
        'Estudos',
      ]);
    });

    it('traz as categorias de volta quando o aluno clica em Limpar filtros', async () => {
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const fixture = await montar((pagina) => pagina.componentRef.setInput('prioridade', 'alta'));

      voltarApi();
      botao(fixture.nativeElement, 'Limpar filtros').click();
      fixture.componentRef.setInput('prioridade', undefined);
      await estabilizar(fixture);

      expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
      expect(await opcoesDoSeletor(fixture, fixture.nativeElement, 'Categoria')).toEqual([
        'Todas',
        'Estudos',
      ]);
    });

    it('oferece as categorias no diálogo de nova tarefa aberto depois que a API volta', async () => {
      const fixture = await montar();

      voltarApi();
      botao(fixture.nativeElement, 'Nova tarefa').click();
      await estabilizar(fixture);

      expect(await opcoesDoSeletor(fixture, sobreposicao(), 'Categoria')).toEqual([
        'Sem categoria',
        'Estudos',
      ]);
    });

    it('avisa quando só as categorias falham, sem esconder as tarefas, e deixa tentar de novo', async () => {
      listar.and.returnValue(of([novaTarefa({ titulo: 'Estudar Docker' })]));
      const fixture = await montar();
      const elemento = fixture.nativeElement as HTMLElement;

      expect(elemento.querySelector('tr.mat-mdc-row')?.textContent).toContain('Estudar Docker');
      expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
        'Não foi possível carregar as categorias.',
      );

      listar.calls.reset();
      listarCategorias.calls.reset();
      listarCategorias.and.returnValue(of([estudos]));
      botao(elemento, 'Tentar de novo').click();
      await estabilizar(fixture);

      expect(listarCategorias).toHaveBeenCalledTimes(1);
      expect(listar).not.toHaveBeenCalled();
      expect(elemento.querySelector('[role="alert"]')).toBeNull();
      expect(await opcoesDoSeletor(fixture, elemento, 'Categoria')).toEqual(['Todas', 'Estudos']);
    });

    it('leva o foco para o filtro de categoria ao tentar de novo, em vez de deixá-lo se perder', async () => {
      listar.and.returnValue(of([novaTarefa({ titulo: 'Estudar Docker' })]));
      const fixture = await montar();
      const elemento = fixture.nativeElement as HTMLElement;
      const tentarDeNovo = botao(elemento.querySelector('.aviso-categorias')!, 'Tentar de novo');
      listarCategorias.and.returnValue(of([estudos]));

      tentarDeNovo.focus();
      tentarDeNovo.click();
      await estabilizar(fixture);

      expect(elemento.querySelector('.aviso-categorias')).toBeNull();
      expect(document.activeElement).toBe(seletor(elemento, 'Categoria')!);
    });

    it('mostra um alerta só quando as tarefas e as categorias falham juntas', async () => {
      const elemento = await renderizar();

      expect(elemento.querySelectorAll('[role="alert"]').length).toBe(1);
      expect(elemento.textContent).toContain('Não foi possível falar com a API');
      expect(elemento.textContent).not.toContain('Não foi possível carregar as categorias.');
    });
  });

  describe('formulário de tarefa', () => {
    it('não mostra aviso nenhum ao cancelar a nova tarefa', async () => {
      const fixture = await montar();
      const abrir = spyOn(TestBed.inject(MatDialog), 'open').and.callThrough();
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova tarefa').click();
      await estabilizar(fixture);
      let resultado: unknown = 'diálogo ainda aberto';
      abrir.calls
        .mostRecent()
        .returnValue.afterClosed()
        .subscribe((valor) => (resultado = valor));
      botao(sobreposicao(), 'Cancelar').click();
      await estabilizar(fixture);

      expect(sobreposicao().querySelector('mat-dialog-container')).toBeNull();
      expect(resultado).toBeUndefined();
      expect(aviso).not.toHaveBeenCalled();
    });

    it('não mostra aviso quando o diálogo fecha sem devolver a tarefa salva', async () => {
      const fixture = await montar();
      const dialogo = TestBed.inject(MatDialog);
      spyOn(dialogo, 'open').and.returnValue({
        afterClosed: () => of(''),
      } as ReturnType<typeof dialogo.open>);
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova tarefa').click();

      expect(aviso).not.toHaveBeenCalled();
    });

    it('avisa que a tarefa foi criada depois de salvar', async () => {
      criar.and.returnValue(of(novaTarefa({ id: 9, titulo: 'Estudar RxJS' })));
      const fixture = await montar();
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova tarefa').click();
      await estabilizar(fixture);
      const titulo = sobreposicao().querySelector<HTMLInputElement>(
        'input[formcontrolname="titulo"]',
      )!;
      titulo.value = 'Estudar RxJS';
      titulo.dispatchEvent(new Event('input'));
      botao(sobreposicao(), 'Salvar').click();
      await estabilizar(fixture);

      expect(criar).toHaveBeenCalledWith(jasmine.objectContaining({ titulo: 'Estudar RxJS' }));
      expect(aviso).toHaveBeenCalledOnceWith('Tarefa criada.', 'OK');
    });
  });

  describe('ordenação', () => {
    const categoria = (id: number, nome: string): Categoria => ({
      id,
      nome,
      cor: '#1e88e5',
      criadaEm: '',
      atualizadaEm: '',
    });

    it('ordena o título pelo alfabeto do português, nos dois sentidos', async () => {
      listar.and.returnValue(
        of(
          ['Zebra', 'Óculos', 'água', 'Ética', 'Banana', 'Capítulo 10', 'Capítulo 2'].map(
            (titulo, indice) => novaTarefa({ id: indice + 1, titulo }),
          ),
        ),
      );
      const fixture = await montar();

      ordenarPor(fixture, 'Título');
      expect(titulos(fixture.nativeElement)).toEqual([
        'água',
        'Banana',
        'Capítulo 2',
        'Capítulo 10',
        'Ética',
        'Óculos',
        'Zebra',
      ]);

      ordenarPor(fixture, 'Título');
      expect(titulos(fixture.nativeElement)).toEqual([
        'Zebra',
        'Óculos',
        'Ética',
        'Capítulo 10',
        'Capítulo 2',
        'Banana',
        'água',
      ]);
    });

    it('ordena a categoria pelo nome com acento e deixa as sem categoria no começo', async () => {
      listar.and.returnValue(
        of([
          novaTarefa({ id: 1, titulo: 'Consulta', categoria: categoria(1, 'Saúde') }),
          novaTarefa({ id: 2, titulo: 'Regar', categoria: categoria(2, 'Água') }),
          novaTarefa({ id: 3, titulo: 'Avulsa', categoria: null }),
          novaTarefa({ id: 4, titulo: 'Cinema', categoria: categoria(3, 'Lazer') }),
        ]),
      );
      const fixture = await montar();

      ordenarPor(fixture, 'Categoria');

      expect(titulos(fixture.nativeElement)).toEqual(['Avulsa', 'Regar', 'Cinema', 'Consulta']);
    });

    it('mantém a ordem numérica de prioridade, status e data', async () => {
      listar.and.returnValue(
        of([
          novaTarefa({
            id: 1,
            titulo: 'Alta antiga',
            prioridade: 'alta',
            concluida: true,
            criadaEm: '2026-01-02T10:00:00.000Z',
          }),
          novaTarefa({
            id: 2,
            titulo: 'Baixa nova',
            prioridade: 'baixa',
            concluida: false,
            criadaEm: '2026-01-10T10:00:00.000Z',
          }),
          novaTarefa({
            id: 3,
            titulo: 'Média do meio',
            prioridade: 'media',
            concluida: false,
            criadaEm: '2026-01-05T10:00:00.000Z',
          }),
        ]),
      );
      const fixture = await montar();

      ordenarPor(fixture, 'Prioridade');
      expect(titulos(fixture.nativeElement)).toEqual([
        'Baixa nova',
        'Média do meio',
        'Alta antiga',
      ]);

      ordenarPor(fixture, 'Status');
      expect(titulos(fixture.nativeElement)).toEqual([
        'Baixa nova',
        'Média do meio',
        'Alta antiga',
      ]);

      ordenarPor(fixture, 'Criada em');
      expect(titulos(fixture.nativeElement)).toEqual([
        'Alta antiga',
        'Média do meio',
        'Baixa nova',
      ]);
    });
  });

  describe('acessibilidade da tabela', () => {
    const checkboxDe = (elemento: HTMLElement, titulo: string): HTMLInputElement =>
      Array.from(elemento.querySelectorAll('tr.mat-mdc-row'))
        .find((linha) => linha.querySelector('.titulo')?.textContent?.trim() === titulo)!
        .querySelector<HTMLInputElement>('mat-checkbox input')!;

    it('mantém a mesma linha na tela ao concluir uma tarefa, sem recriar', async () => {
      const tarefa = novaTarefa({ id: 7, titulo: 'Revisar PR' });
      listar.and.returnValue(of([tarefa]));
      atualizar.and.returnValue(of({ ...tarefa, concluida: true }));
      const fixture = await montar();
      const linha = fixture.nativeElement.querySelector('tr.mat-mdc-row');
      listar.and.returnValue(of([{ ...tarefa, concluida: true }]));

      checkboxDe(fixture.nativeElement, 'Revisar PR').click();
      await estabilizar(fixture);

      expect(atualizar).toHaveBeenCalledWith(7, { concluida: true });
      expect(listar).toHaveBeenCalledTimes(2);
      expect(fixture.nativeElement.querySelector('tr.mat-mdc-row')).toBe(linha);
      expect(linha.classList).toContain('concluida');
    });

    it('devolve o foco ao checkbox da tarefa quando a ordenação move a linha', async () => {
      const [alfa, beta, gama] = ['Alfa', 'Beta', 'Gama'].map((titulo, indice) =>
        novaTarefa({ id: indice + 1, titulo }),
      );
      listar.and.returnValue(of([alfa, beta, gama]));
      atualizar.and.returnValue(of({ ...gama, concluida: true }));
      const fixture = await montar();
      ordenarPor(fixture, 'Status');
      ordenarPor(fixture, 'Status');
      const checkbox = checkboxDe(fixture.nativeElement, 'Gama');
      listar.and.returnValue(of([alfa, beta, { ...gama, concluida: true }]));

      checkbox.focus();
      checkbox.click();
      await estabilizar(fixture);

      expect(titulos(fixture.nativeElement)).toEqual(['Gama', 'Alfa', 'Beta']);
      expect(checkbox.isConnected).toBeTrue();
      expect(document.activeElement).toBe(checkbox);
    });

    it('avisa o leitor de tela quando a tarefa é concluída ou reaberta', async () => {
      const anunciar = spyOn(TestBed.inject(LiveAnnouncer), 'announce').and.resolveTo();
      const alfa = novaTarefa({ id: 1, titulo: 'Alfa' });
      const beta = novaTarefa({ id: 2, titulo: 'Beta', concluida: true });
      listar.and.returnValue(of([alfa, beta]));
      atualizar.and.callFake((id: number, dados: Partial<Tarefa>) =>
        of({ ...(id === alfa.id ? alfa : beta), ...dados }),
      );
      const fixture = await montar();

      checkboxDe(fixture.nativeElement, 'Alfa').click();
      await estabilizar(fixture);
      checkboxDe(fixture.nativeElement, 'Beta').click();
      await estabilizar(fixture);

      expect(anunciar.calls.allArgs()).toEqual([
        ['Tarefa concluída: Alfa'],
        ['Tarefa reaberta: Beta'],
      ]);
    });

    describe('quando a tarefa sai da página atual', () => {
      let banco: Tarefa[];

      const criarBanco = (total: number, concluidas: number[] = []): void => {
        banco = Array.from({ length: total }, (_, indice) =>
          novaTarefa({
            id: indice + 1,
            titulo: `T${indice + 1}`,
            concluida: concluidas.includes(indice + 1),
            criadaEm: new Date(Date.UTC(2026, 0, 30 - indice)).toISOString(),
          }),
        );
      };

      const paginador = (fixture: ComponentFixture<TarefasPage>): MatPaginator =>
        fixture.debugElement.query(By.directive(MatPaginator)).injector.get(MatPaginator);

      beforeEach(() => {
        listar.and.callFake((filtro: FiltroTarefas = {}) =>
          of(
            banco
              .filter(
                (tarefa) => filtro.concluida === undefined || tarefa.concluida === filtro.concluida,
              )
              .sort(
                (a, b) =>
                  Number(a.concluida) - Number(b.concluida) ||
                  Date.parse(b.criadaEm) - Date.parse(a.criadaEm),
              ),
          ),
        );
        atualizar.and.callFake((id: number, dados: Partial<Tarefa>) => {
          banco = banco.map((tarefa) => (tarefa.id === id ? { ...tarefa, ...dados } : tarefa));
          return of(banco.find((tarefa) => tarefa.id === id));
        });
      });

      it('foca o checkbox que ficou na mesma posição quando a concluída vai para outra página', async () => {
        criarBanco(12);
        const fixture = await montar();
        const alvo = checkboxDe(fixture.nativeElement, 'T1');

        alvo.focus();
        alvo.click();
        await estabilizar(fixture);

        expect(atualizar).toHaveBeenCalledWith(1, { concluida: true });
        expect(titulos(fixture.nativeElement)).not.toContain('T1');
        expect(document.activeElement).toBe(checkboxDe(fixture.nativeElement, 'T2'));
      });

      it('foca o checkbox que ficou na mesma posição quando a reaberta sobe para outra página', async () => {
        criarBanco(12, [1]);
        const fixture = await montar();
        paginador(fixture).nextPage();
        fixture.detectChanges();
        expect(titulos(fixture.nativeElement)).toEqual(['T12', 'T1']);
        const alvo = checkboxDe(fixture.nativeElement, 'T1');

        alvo.focus();
        alvo.click();
        await estabilizar(fixture);

        expect(atualizar).toHaveBeenCalledWith(1, { concluida: false });
        expect(titulos(fixture.nativeElement)).toEqual(['T11', 'T12']);
        expect(document.activeElement).toBe(checkboxDe(fixture.nativeElement, 'T12'));
      });

      it('foca a tabela quando a lista filtrada fica vazia depois de concluir', async () => {
        criarBanco(1);
        const fixture = await montar((pagina) =>
          pagina.componentRef.setInput('status', 'pendentes'),
        );
        const alvo = checkboxDe(fixture.nativeElement, 'T1');

        alvo.focus();
        alvo.click();
        await estabilizar(fixture);

        expect(fixture.nativeElement.textContent).toContain(
          'Nenhuma tarefa encontrada com esses filtros.',
        );
        expect(document.activeElement).toBe(fixture.nativeElement.querySelector('table'));
      });

      it('foca o checkbox da nova última linha quando a última tarefa sai da lista filtrada', async () => {
        criarBanco(3);
        const fixture = await montar((pagina) =>
          pagina.componentRef.setInput('status', 'pendentes'),
        );
        expect(titulos(fixture.nativeElement)).toEqual(['T1', 'T2', 'T3']);
        const alvo = checkboxDe(fixture.nativeElement, 'T3');

        alvo.focus();
        alvo.click();
        await estabilizar(fixture);

        expect(titulos(fixture.nativeElement)).toEqual(['T1', 'T2']);
        expect(document.activeElement).toBe(checkboxDe(fixture.nativeElement, 'T2'));
      });

      describe('ao salvar pelo Editar', () => {
        const botaoDaLinha = (elemento: HTMLElement, rotulo: string): HTMLButtonElement =>
          elemento.querySelector<HTMLButtonElement>(`button[aria-label="${rotulo}"]`)!;

        const concluirPeloFormulario = async (
          fixture: ComponentFixture<TarefasPage>,
          editar: HTMLButtonElement,
        ): Promise<void> => {
          editar.focus();
          editar.click();
          await estabilizar(fixture);
          sobreposicao().querySelector<HTMLInputElement>('mat-checkbox input')!.click();
          botao(sobreposicao(), 'Salvar').click();
        };

        it('foca o Editar da linha que ficou na mesma posição quando a tarefa sai da lista', async () => {
          criarBanco(3);
          const fixture = await montar((pagina) =>
            pagina.componentRef.setInput('status', 'pendentes'),
          );

          await concluirPeloFormulario(fixture, botaoDaLinha(fixture.nativeElement, 'Editar T1'));
          await estabilizar(fixture);

          expect(atualizar).toHaveBeenCalledWith(1, jasmine.objectContaining({ concluida: true }));
          expect(sobreposicao().querySelector('mat-dialog-container')).toBeNull();
          expect(titulos(fixture.nativeElement)).toEqual(['T2', 'T3']);
          expect(document.activeElement).toBe(botaoDaLinha(fixture.nativeElement, 'Editar T2'));
        });

        it('foca o Editar da mesma posição quando a lista nova chega depois de o diálogo fechar', async () => {
          criarBanco(3);
          const fixture = await montar((pagina) =>
            pagina.componentRef.setInput('status', 'pendentes'),
          );
          const editar = botaoDaLinha(fixture.nativeElement, 'Editar T1');
          const listaNova = new Subject<Tarefa[]>();
          listar.and.returnValue(listaNova);

          await concluirPeloFormulario(fixture, editar);
          await estabilizar(fixture);
          expect(document.activeElement).toBe(editar);

          listaNova.next(banco.filter((tarefa) => !tarefa.concluida));
          await estabilizar(fixture);

          expect(titulos(fixture.nativeElement)).toEqual(['T2', 'T3']);
          expect(document.activeElement).toBe(botaoDaLinha(fixture.nativeElement, 'Editar T2'));
        });
      });
    });

    it('descreve em português a ação de ordenar de cada coluna', async () => {
      const fixture = await montar();

      const descricoes = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(
          'th[mat-sort-header] [aria-describedby]',
        ),
      ).map(
        (botao) => document.getElementById(botao.getAttribute('aria-describedby')!)?.textContent,
      );

      expect(descricoes).toEqual([
        'Ordenar por status',
        'Ordenar por título',
        'Ordenar por categoria',
        'Ordenar por prioridade',
        'Ordenar por data de criação',
      ]);
    });
  });

  describe('busca e paginação', () => {
    const digitar = (campo: HTMLInputElement, texto: string): void => {
      campo.value = texto;
      campo.dispatchEvent(new Event('input'));
    };

    it('volta a filtrar quando a mesma busca é digitada depois de limpar os filtros', fakeAsync(() => {
      const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const fixture = TestBed.createComponent(TarefasPage);
      fixture.detectChanges();
      const campo = fixture.nativeElement.querySelector('.busca input') as HTMLInputElement;

      digitar(campo, 'docker');
      tick(300);
      fixture.componentRef.setInput('busca', 'docker');
      fixture.detectChanges();

      botao(fixture.nativeElement, 'Limpar filtros').click();
      fixture.componentRef.setInput('busca', undefined);
      fixture.detectChanges();
      expect(campo.value).toBe('');

      digitar(campo, 'docker');
      tick(300);
      fixture.componentRef.setInput('busca', 'docker');
      fixture.detectChanges();
      flush();

      const parametros = navegar.calls.allArgs().map(([, extras]) => extras?.queryParams);
      expect(parametros).toEqual([{ busca: 'docker' }, {}, { busca: 'docker' }]);
      expect(listar).toHaveBeenCalledTimes(4);
      expect(listar.calls.mostRecent().args[0]).toEqual(
        jasmine.objectContaining({ busca: 'docker' }),
      );
    }));

    it('leva a tabela para a primeira página sempre que o filtro muda', fakeAsync(() => {
      listar.and.returnValue(
        of(
          Array.from({ length: 25 }, (_, indice) =>
            novaTarefa({ id: indice + 1, titulo: `Tarefa ${indice + 1}` }),
          ),
        ),
      );
      const fixture = TestBed.createComponent(TarefasPage);
      fixture.detectChanges();
      flush();
      const paginador = fixture.debugElement
        .query(By.directive(MatPaginator))
        .injector.get(MatPaginator);
      const mudancas: [string, string | undefined][] = [
        ['busca', 'docker'],
        ['categoria', '3'],
        ['status', 'pendentes'],
        ['prioridade', 'alta'],
        ['prioridade', undefined],
      ];

      for (const [entrada, valor] of mudancas) {
        paginador.nextPage();
        fixture.detectChanges();
        expect(paginador.pageIndex).withContext(`antes de mudar ${entrada}`).toBe(1);

        fixture.componentRef.setInput(entrada, valor);
        fixture.detectChanges();
        flush();
        fixture.detectChanges();

        expect(paginador.pageIndex).withContext(`depois de mudar ${entrada}`).toBe(0);
        expect(fixture.nativeElement.querySelector('tr.mat-mdc-row .titulo')?.textContent?.trim())
          .withContext(`primeira linha depois de mudar ${entrada}`)
          .toBe('Tarefa 1');
      }
    }));
  });
});
