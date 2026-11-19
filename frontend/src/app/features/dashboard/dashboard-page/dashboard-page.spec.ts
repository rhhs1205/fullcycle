import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { appConfig } from '../../../app.config';
import { Tarefa } from '../../tarefas/data/tarefa.model';
import { DashboardService } from '../data/dashboard.service';
import { Resumo } from '../data/resumo.model';
import { DashboardPage } from './dashboard-page';

const tarefa = (id: number, titulo: string, prioridade: Tarefa['prioridade']): Tarefa => ({
  id,
  titulo,
  descricao: null,
  prioridade,
  concluida: false,
  categoriaId: null,
  categoria: null,
  criadaEm: '',
  atualizadaEm: '',
});

const resumo: Resumo = {
  total: 4,
  concluidas: 1,
  pendentes: 3,
  percentualConcluido: 25,
  pendentesPorPrioridade: { alta: 2, media: 0, baixa: 1 },
  porCategoria: [
    { id: 1, nome: 'Estudos', cor: '#1e88e5', total: 3, concluidas: 1 },
    { id: null, nome: 'Sem categoria', cor: null, total: 1, concluidas: 0 },
  ],
  proximas: [tarefa(1, 'Corrigir o bug', 'alta'), tarefa(2, 'Estudar Docker', 'baixa')],
};

describe('DashboardPage', () => {
  const renderizar = async (
    resposta: Observable<Resumo>,
    configuracao: unknown[] = [provideRouter([])],
  ): Promise<HTMLElement> => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        ...configuracao,
        { provide: DashboardService, useValue: { resumo: () => resposta } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('mostra os indicadores do resumo', async () => {
    const elemento = await renderizar(of(resumo));

    const valores = Array.from(elemento.querySelectorAll('app-indicador-card .valor')).map((item) =>
      item.textContent?.trim(),
    );
    expect(valores).toEqual(['4', '3', '1', '25%']);
  });

  it('mostra o progresso de cada categoria', async () => {
    const elemento = await renderizar(of(resumo));

    const quantidades = Array.from(
      elemento.querySelectorAll('.paineis mat-card:last-child .quantidade'),
    ).map((item) => item.textContent?.trim());
    expect(quantidades).toEqual(['1/3', '0/1']);
  });

  it('lista as próximas tarefas na ordem da API', async () => {
    const elemento = await renderizar(of(resumo));

    const titulos = Array.from(elemento.querySelectorAll('.proximas .titulo')).map((item) =>
      item.textContent?.trim(),
    );
    expect(titulos).toEqual(['Corrigir o bug', 'Estudar Docker']);
  });

  it('dá nome a cada barra de progresso', async () => {
    const elemento = await renderizar(of(resumo));

    const nomes = Array.from(elemento.querySelectorAll('[role="progressbar"]')).map((barra) =>
      barra.getAttribute('aria-label'),
    );
    expect(nomes).toEqual([
      'Progresso geral',
      'Pendentes por prioridade: Alta',
      'Pendentes por prioridade: Média',
      'Pendentes por prioridade: Baixa',
      'Progresso por categoria: Estudos',
      'Progresso por categoria: Sem categoria',
    ]);
  });

  it('formata os números no padrão brasileiro configurado no app', async () => {
    const elemento = await renderizar(
      of({
        ...resumo,
        total: 12345,
        concluidas: 10000,
        pendentes: 2345,
        percentualConcluido: 81,
        pendentesPorPrioridade: { alta: 1200, media: 1000, baixa: 145 },
        porCategoria: [{ id: 1, nome: 'Estudos', cor: '#1e88e5', total: 12345, concluidas: 10000 }],
      }),
      appConfig.providers,
    );

    const textos = (seletor: string): (string | undefined)[] =>
      Array.from(elemento.querySelectorAll(seletor)).map((item) => item.textContent?.trim());
    expect(textos('app-indicador-card .valor')).toEqual(['12.345', '2.345', '10.000', '81%']);
    expect(textos('.paineis .quantidade')).toEqual(['1.200', '1.000', '145', '10.000/12.345']);
  });

  it('mostra o erro quando o resumo não carrega', async () => {
    const elemento = await renderizar(
      throwError(() => ({ status: 0, mensagem: 'Tente de novo em instantes.' })),
    );

    expect(elemento.textContent).toContain('Tente de novo em instantes.');
  });
});
