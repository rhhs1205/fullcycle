import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Tarefa } from '../tarefas/tarefa.entity';
import { DashboardService } from './dashboard.service';

type RepositorioMock = jest.Mocked<
  Pick<Repository<Tarefa>, 'count' | 'countBy' | 'createQueryBuilder'>
>;

const consulta = (resultado: unknown): SelectQueryBuilder<Tarefa> => {
  const construtor = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(resultado),
    getMany: jest.fn().mockResolvedValue(resultado),
  };
  return construtor as unknown as SelectQueryBuilder<Tarefa>;
};

describe('DashboardService', () => {
  let service: DashboardService;
  let repositorio: RepositorioMock;

  beforeEach(async () => {
    repositorio = {
      count: jest.fn(),
      countBy: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const modulo = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Tarefa), useValue: repositorio },
      ],
    }).compile();

    service = modulo.get(DashboardService);
  });

  it('monta o resumo com totais, prioridades, categorias e próximas', async () => {
    const proxima = Object.assign(new Tarefa(), { id: 7, titulo: 'Urgente' });
    repositorio.count.mockResolvedValue(4);
    repositorio.countBy.mockResolvedValue(1);
    repositorio.createQueryBuilder
      .mockReturnValueOnce(
        consulta([
          { prioridade: 'alta', quantidade: 2 },
          { prioridade: 'baixa', quantidade: 1 },
        ]),
      )
      .mockReturnValueOnce(
        consulta([
          { id: 1, nome: 'Estudos', cor: '#1e88e5', total: 3, concluidas: 1 },
          { id: null, nome: null, cor: null, total: 1, concluidas: 0 },
        ]),
      )
      .mockReturnValueOnce(consulta([proxima]));

    const resumo = await service.resumo();

    expect(resumo).toEqual({
      total: 4,
      concluidas: 1,
      pendentes: 3,
      percentualConcluido: 25,
      pendentesPorPrioridade: { alta: 2, media: 0, baixa: 1 },
      porCategoria: [
        { id: 1, nome: 'Estudos', cor: '#1e88e5', total: 3, concluidas: 1 },
        { id: null, nome: 'Sem categoria', cor: null, total: 1, concluidas: 0 },
      ],
      proximas: [proxima],
    });
    expect(repositorio.countBy).toHaveBeenCalledWith({ concluida: true });
  });

  it('devolve zero por cento quando não há tarefas', async () => {
    repositorio.count.mockResolvedValue(0);
    repositorio.countBy.mockResolvedValue(0);
    repositorio.createQueryBuilder.mockImplementation(() => consulta([]));

    const resumo = await service.resumo();

    expect(resumo.percentualConcluido).toBe(0);
    expect(resumo.pendentesPorPrioridade).toEqual({
      alta: 0,
      media: 0,
      baixa: 0,
    });
  });
});
