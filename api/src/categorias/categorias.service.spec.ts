import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Categoria } from './categoria.entity';
import { CategoriasService } from './categorias.service';

type RepositorioMock = jest.Mocked<
  Pick<
    Repository<Categoria>,
    | 'createQueryBuilder'
    | 'findOneBy'
    | 'existsBy'
    | 'create'
    | 'save'
    | 'merge'
    | 'remove'
  >
>;

const novaCategoria = (dados: Partial<Categoria> = {}): Categoria =>
  Object.assign(new Categoria(), {
    id: 1,
    nome: 'Estudos',
    cor: '#1e88e5',
    criadaEm: new Date('2026-01-01T10:00:00Z'),
    atualizadaEm: new Date('2026-01-01T10:00:00Z'),
    ...dados,
  });

describe('CategoriasService', () => {
  let service: CategoriasService;
  let repositorio: RepositorioMock;

  beforeEach(async () => {
    repositorio = {
      createQueryBuilder: jest.fn(),
      findOneBy: jest.fn(),
      existsBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      merge: jest.fn(),
      remove: jest.fn(),
    };

    const modulo = await Test.createTestingModule({
      providers: [
        CategoriasService,
        { provide: getRepositoryToken(Categoria), useValue: repositorio },
      ],
    }).compile();

    service = modulo.get(CategoriasService);
  });

  it('lista as categorias com o total de tarefas de cada uma', async () => {
    const estudos = novaCategoria();
    const trabalho = novaCategoria({ id: 2, nome: 'Trabalho' });
    const consulta = {
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawAndEntities: jest.fn().mockResolvedValue({
        entities: [estudos, trabalho],
        raw: [{ total_tarefas: 3 }, { total_tarefas: 0 }],
      }),
    };
    repositorio.createQueryBuilder.mockReturnValue(
      consulta as unknown as SelectQueryBuilder<Categoria>,
    );

    const categorias = await service.listar();

    expect(categorias.map((c) => [c.nome, c.totalTarefas])).toEqual([
      ['Estudos', 3],
      ['Trabalho', 0],
    ]);
    expect(consulta.orderBy).toHaveBeenCalledWith('categoria.nome', 'ASC');
  });

  it('lança NotFoundException quando a categoria não existe', async () => {
    repositorio.findOneBy.mockResolvedValue(null);

    await expect(service.buscar(99)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('cria uma categoria com nome disponível', async () => {
    const dto = { nome: 'Casa', cor: '#43a047' };
    const criada = novaCategoria({ id: 3, ...dto });
    repositorio.findOneBy.mockResolvedValue(null);
    repositorio.create.mockReturnValue(criada);
    repositorio.save.mockResolvedValue(criada);

    await expect(service.criar(dto)).resolves.toBe(criada);
    expect(repositorio.save).toHaveBeenCalledWith(criada);
  });

  it('recusa criar categoria com nome repetido', async () => {
    repositorio.findOneBy.mockResolvedValue(novaCategoria());

    await expect(service.criar({ nome: 'estudos' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('permite manter o próprio nome ao atualizar', async () => {
    const categoria = novaCategoria();
    const atualizada = novaCategoria({ cor: '#000000' });
    repositorio.findOneBy
      .mockResolvedValueOnce(categoria)
      .mockResolvedValueOnce(categoria);
    repositorio.merge.mockReturnValue(atualizada);
    repositorio.save.mockResolvedValue(atualizada);

    await expect(
      service.atualizar(1, { nome: 'Estudos', cor: '#000000' }),
    ).resolves.toBe(atualizada);
  });

  it('recusa renomear para o nome de outra categoria', async () => {
    repositorio.findOneBy
      .mockResolvedValueOnce(novaCategoria())
      .mockResolvedValueOnce(novaCategoria({ id: 2, nome: 'Trabalho' }));

    await expect(
      service.atualizar(1, { nome: 'Trabalho' }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repositorio.save).not.toHaveBeenCalled();
  });

  it('remove uma categoria existente', async () => {
    const categoria = novaCategoria();
    repositorio.findOneBy.mockResolvedValue(categoria);
    repositorio.remove.mockResolvedValue(categoria);

    await expect(service.remover(1)).resolves.toBeUndefined();
    expect(repositorio.remove).toHaveBeenCalledWith(categoria);
  });

  it('informa se uma categoria existe', async () => {
    repositorio.existsBy.mockResolvedValue(true);

    await expect(service.existe(1)).resolves.toBe(true);
    expect(repositorio.existsBy).toHaveBeenCalledWith({ id: 1 });
  });
});
