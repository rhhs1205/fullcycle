import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CategoriasService } from '../categorias/categorias.service';
import { Tarefa } from './tarefa.entity';
import { TarefasService } from './tarefas.service';

type RepositorioMock = jest.Mocked<
  Pick<
    Repository<Tarefa>,
    'find' | 'findOne' | 'findOneBy' | 'create' | 'save' | 'merge' | 'remove'
  >
>;

const novaTarefa = (dados: Partial<Tarefa> = {}): Tarefa =>
  Object.assign(new Tarefa(), {
    id: 1,
    titulo: 'Estudar NestJS',
    descricao: null,
    prioridade: 'media',
    concluida: false,
    categoriaId: null,
    criadaEm: new Date('2026-01-01T10:00:00Z'),
    atualizadaEm: new Date('2026-01-01T10:00:00Z'),
    ...dados,
  });

describe('TarefasService', () => {
  let service: TarefasService;
  let repositorio: RepositorioMock;
  let categorias: { existe: jest.Mock<Promise<boolean>, [number]> };

  beforeEach(async () => {
    repositorio = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    };
    categorias = { existe: jest.fn<Promise<boolean>, [number]>() };

    const modulo = await Test.createTestingModule({
      providers: [
        TarefasService,
        { provide: getRepositoryToken(Tarefa), useValue: repositorio },
        { provide: CategoriasService, useValue: categorias },
      ],
    }).compile();

    service = modulo.get(TarefasService);
  });

  describe('listar', () => {
    it('traz pendentes primeiro, as mais novas no topo e com a categoria', async () => {
      repositorio.find.mockResolvedValue([]);

      await service.listar();

      expect(repositorio.find).toHaveBeenCalledWith({
        where: {},
        relations: { categoria: true },
        order: { concluida: 'ASC', criadaEm: 'DESC' },
      });
    });

    it('aplica só os filtros informados', async () => {
      repositorio.find.mockResolvedValue([]);

      await service.listar({ concluida: false, categoriaId: 2 });

      expect(repositorio.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { concluida: false, categoriaId: 2 },
        }),
      );
    });

    it('busca o texto no título ou na descrição', async () => {
      repositorio.find.mockResolvedValue([]);

      await service.listar({ prioridade: 'alta', busca: 'docker' });

      expect(repositorio.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [
            { prioridade: 'alta', titulo: ILike('%docker%') },
            { prioridade: 'alta', descricao: ILike('%docker%') },
          ],
        }),
      );
    });

    it('trata %, _ e a barra invertida da busca como texto comum', async () => {
      repositorio.find.mockResolvedValue([]);

      await service.listar({ busca: String.raw`100%_a\b` });

      const termo = ILike(String.raw`%100\%\_a\\b%`);
      expect(repositorio.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: [{ titulo: termo }, { descricao: termo }],
        }),
      );
    });
  });

  it('lança NotFoundException quando a tarefa não existe', async () => {
    repositorio.findOne.mockResolvedValue(null);

    await expect(service.buscar(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  describe('criar', () => {
    it('salva e devolve a tarefa com a categoria carregada', async () => {
      const dto = { titulo: 'Estudar Docker', categoriaId: 2 };
      const salva = novaTarefa({ id: 5, ...dto });
      const completa = novaTarefa({ id: 5, ...dto });
      categorias.existe.mockResolvedValue(true);
      repositorio.create.mockReturnValue(salva);
      repositorio.save.mockResolvedValue(salva);
      repositorio.findOne.mockResolvedValue(completa);

      await expect(service.criar(dto)).resolves.toBe(completa);
      expect(categorias.existe).toHaveBeenCalledWith(2);
      expect(repositorio.findOne).toHaveBeenCalledWith({
        where: { id: 5 },
        relations: { categoria: true },
      });
    });

    it('não consulta categoria quando a tarefa não tem uma', async () => {
      const salva = novaTarefa();
      repositorio.create.mockReturnValue(salva);
      repositorio.save.mockResolvedValue(salva);
      repositorio.findOne.mockResolvedValue(salva);

      await service.criar({ titulo: 'Sem categoria' });

      expect(categorias.existe).not.toHaveBeenCalled();
    });

    it('recusa categoria inexistente', async () => {
      categorias.existe.mockResolvedValue(false);

      await expect(
        service.criar({ titulo: 'X', categoriaId: 99 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repositorio.save).not.toHaveBeenCalled();
    });
  });

  describe('atualizar', () => {
    it('mescla os dados, salva e recarrega a tarefa', async () => {
      const tarefa = novaTarefa();
      const mesclada = novaTarefa({ concluida: true });
      repositorio.findOneBy.mockResolvedValue(tarefa);
      repositorio.merge.mockReturnValue(mesclada);
      repositorio.save.mockResolvedValue(mesclada);
      repositorio.findOne.mockResolvedValue(mesclada);

      await expect(service.atualizar(1, { concluida: true })).resolves.toBe(
        mesclada,
      );
      expect(repositorio.merge).toHaveBeenCalledWith(tarefa, {
        concluida: true,
      });
      expect(repositorio.save).toHaveBeenCalledWith(mesclada);
    });

    it('permite remover a categoria com null', async () => {
      const tarefa = novaTarefa({ categoriaId: 2 });
      repositorio.findOneBy.mockResolvedValue(tarefa);
      repositorio.merge.mockReturnValue(tarefa);
      repositorio.save.mockResolvedValue(tarefa);
      repositorio.findOne.mockResolvedValue(tarefa);

      await service.atualizar(1, { categoriaId: null });

      expect(categorias.existe).not.toHaveBeenCalled();
      expect(repositorio.merge).toHaveBeenCalledWith(tarefa, {
        categoriaId: null,
      });
    });

    it('não atualiza tarefa inexistente', async () => {
      repositorio.findOneBy.mockResolvedValue(null);

      await expect(
        service.atualizar(99, { concluida: true }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repositorio.save).not.toHaveBeenCalled();
    });
  });

  describe('remover', () => {
    it('remove uma tarefa existente', async () => {
      const tarefa = novaTarefa();
      repositorio.findOneBy.mockResolvedValue(tarefa);
      repositorio.remove.mockResolvedValue(tarefa);

      await expect(service.remover(1)).resolves.toBeUndefined();
      expect(repositorio.remove).toHaveBeenCalledWith(tarefa);
    });

    it('não remove tarefa inexistente', async () => {
      repositorio.findOneBy.mockResolvedValue(null);

      await expect(service.remover(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repositorio.remove).not.toHaveBeenCalled();
    });
  });
});
