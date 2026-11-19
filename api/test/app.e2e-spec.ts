import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OpenAPIObject, SchemaObject } from '@nestjs/swagger';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Categoria } from '../src/categorias/categoria.entity';
import { CategoriaComTotalDto } from '../src/categorias/dto/categoria-com-total.dto';
import { ErroRespostaDto } from '../src/common/dto/erro-resposta.dto';
import { configurarApp, criarDocumentoSwagger } from '../src/configurar-app';
import { ResumoDto } from '../src/dashboard/dto/resumo.dto';
import { Tarefa } from '../src/tarefas/tarefa.entity';

const mensagens = (corpo: unknown): string[] =>
  [(corpo as ErroRespostaDto).message].flat();

const mensagemId = 'O id deve ser um número inteiro entre 1 e 2147483647';

const mensagemCategoriaId =
  'categoriaId deve ser um número inteiro entre 1 e 2147483647';

const exemploDoSchema = (
  documento: OpenAPIObject,
  nome: string,
): Record<string, unknown> => {
  const schema = documento.components?.schemas?.[nome] as SchemaObject;
  const exemplo: Record<string, unknown> = {};
  for (const [campo, propriedade] of Object.entries(schema.properties ?? {})) {
    exemplo[campo] = (propriedade as SchemaObject).example as unknown;
  }
  return exemplo;
};

describe('API (e2e)', () => {
  let app: INestApplication<App>;
  const sufixo = Date.now().toString(36);

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = modulo.createNestApplication();
    configurarApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health confirma que a API e o banco estão no ar', async () => {
    const resposta = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(resposta.body).toMatchObject({ status: 'ok', banco: 'ok' });
  });

  describe('fluxo de categorias e tarefas', () => {
    let categoria: Categoria;
    let tarefa: Tarefa;

    it('cria uma categoria', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `  E2E ${sufixo}  `, cor: '#8e24aa' })
        .expect(201);

      categoria = resposta.body as Categoria;
      expect(categoria.nome).toBe(`E2E ${sufixo}`);
    });

    it('recusa categoria com nome repetido, ignorando maiúsculas', async () => {
      await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `e2e ${sufixo}` })
        .expect(409);
    });

    it('recusa cor fora do formato #RRGGBB', async () => {
      await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `Cor ${sufixo}`, cor: 'roxo' })
        .expect(400);
    });

    it('recusa tarefa sem título', async () => {
      await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: '   ' })
        .expect(400);
    });

    it('recusa tarefa com categoria inexistente', async () => {
      await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: 'Tarefa órfã', categoriaId: 999999 })
        .expect(400);
    });

    it('cria uma tarefa dentro da categoria', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({
          titulo: `Tarefa e2e ${sufixo}`,
          descricao: '',
          prioridade: 'alta',
          categoriaId: categoria.id,
        })
        .expect(201);

      tarefa = resposta.body as Tarefa;
      expect(tarefa).toMatchObject({
        descricao: null,
        prioridade: 'alta',
        concluida: false,
        categoriaId: categoria.id,
      });
      expect(tarefa.categoria?.nome).toBe(categoria.nome);
    });

    it('filtra tarefas por categoria, status e texto', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/tarefas')
        .query({ categoriaId: categoria.id, concluida: false, busca: sufixo })
        .expect(200);

      const tarefas = resposta.body as Tarefa[];
      expect(tarefas.map((t) => t.id)).toEqual([tarefa.id]);
    });

    it('conta as tarefas de cada categoria', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/categorias')
        .expect(200);

      const categorias = resposta.body as CategoriaComTotalDto[];
      expect(categorias.find((c) => c.id === categoria.id)?.totalTarefas).toBe(
        1,
      );
    });

    it('leva a tarefa para o resumo do dashboard', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/dashboard/resumo')
        .expect(200);

      const resumo = resposta.body as ResumoDto;
      expect(resumo.total).toBe(resumo.concluidas + resumo.pendentes);
      expect(resumo.pendentesPorPrioridade.alta).toBeGreaterThanOrEqual(1);
      expect(resumo.porCategoria).toContainEqual({
        id: categoria.id,
        nome: categoria.nome,
        cor: '#8e24aa',
        total: 1,
        concluidas: 0,
      });
    });

    it('conclui a tarefa', async () => {
      const resposta = await request(app.getHttpServer())
        .patch(`/tarefas/${tarefa.id}`)
        .send({ concluida: true })
        .expect(200);

      expect((resposta.body as Tarefa).concluida).toBe(true);
    });

    it('deixa a tarefa sem categoria quando a categoria é apagada', async () => {
      await request(app.getHttpServer())
        .delete(`/categorias/${categoria.id}`)
        .expect(204);

      const resposta = await request(app.getHttpServer())
        .get(`/tarefas/${tarefa.id}`)
        .expect(200);
      expect((resposta.body as Tarefa).categoriaId).toBeNull();
    });

    it('remove a tarefa', async () => {
      await request(app.getHttpServer())
        .delete(`/tarefas/${tarefa.id}`)
        .expect(204);
      await request(app.getHttpServer())
        .get(`/tarefas/${tarefa.id}`)
        .expect(404);
    });
  });

  describe('null nos campos', () => {
    let categoria: Categoria;
    let tarefa: Tarefa;
    const idsTarefas: number[] = [];

    beforeAll(async () => {
      const respostaCategoria = await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `Nulos ${sufixo}` })
        .expect(201);
      categoria = respostaCategoria.body as Categoria;

      const respostaTarefa = await request(app.getHttpServer())
        .post('/tarefas')
        .send({
          titulo: `Nulos ${sufixo}`,
          descricao: 'Será limpa com null',
          categoriaId: categoria.id,
        })
        .expect(201);
      tarefa = respostaTarefa.body as Tarefa;
      idsTarefas.push(tarefa.id);
    });

    afterAll(async () => {
      for (const id of idsTarefas) {
        await request(app.getHttpServer()).delete(`/tarefas/${id}`);
      }
      await request(app.getHttpServer()).delete(`/categorias/${categoria.id}`);
    });

    it.each(['prioridade', 'concluida'])(
      'POST /tarefas recusa %s: null',
      async (campo) => {
        const resposta = await request(app.getHttpServer())
          .post('/tarefas')
          .send({ titulo: `Nulos ${sufixo}`, [campo]: null })
          .expect(400);

        expect(mensagens(resposta.body)).toContainEqual(
          expect.stringContaining(campo),
        );
      },
    );

    it.each(['titulo', 'prioridade', 'concluida'])(
      'PATCH /tarefas/:id recusa %s: null',
      async (campo) => {
        const resposta = await request(app.getHttpServer())
          .patch(`/tarefas/${tarefa.id}`)
          .send({ [campo]: null })
          .expect(400);

        expect(mensagens(resposta.body)).toContainEqual(
          expect.stringContaining(campo),
        );
      },
    );

    it('POST /categorias recusa cor: null', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `Nulos sem cor ${sufixo}`, cor: null })
        .expect(400);

      expect(mensagens(resposta.body)).toContainEqual(
        expect.stringContaining('cor'),
      );
    });

    it.each(['nome', 'cor'])(
      'PATCH /categorias/:id recusa %s: null',
      async (campo) => {
        const resposta = await request(app.getHttpServer())
          .patch(`/categorias/${categoria.id}`)
          .send({ [campo]: null })
          .expect(400);

        expect(mensagens(resposta.body)).toContainEqual(
          expect.stringContaining(campo),
        );
      },
    );

    it('POST /tarefas aceita descricao e categoriaId null', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: `Nulos ${sufixo}`, descricao: null, categoriaId: null })
        .expect(201);

      const criada = resposta.body as Tarefa;
      idsTarefas.push(criada.id);
      expect(criada).toMatchObject({ descricao: null, categoriaId: null });
    });

    it('PATCH /tarefas/:id limpa a descrição com null', async () => {
      const resposta = await request(app.getHttpServer())
        .patch(`/tarefas/${tarefa.id}`)
        .send({ descricao: null })
        .expect(200);

      expect(resposta.body).toMatchObject({
        descricao: null,
        categoriaId: categoria.id,
      });
    });

    it('PATCH /tarefas/:id tira a categoria com null', async () => {
      const resposta = await request(app.getHttpServer())
        .patch(`/tarefas/${tarefa.id}`)
        .send({ categoriaId: null })
        .expect(200);

      expect(resposta.body).toMatchObject({
        categoriaId: null,
        categoria: null,
      });
    });
  });

  describe('id maior que o integer do banco', () => {
    const idGigante = 99999999999;
    let tarefa: Tarefa;

    beforeAll(async () => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: `Id gigante ${sufixo}` })
        .expect(201);
      tarefa = resposta.body as Tarefa;
    });

    afterAll(async () => {
      await request(app.getHttpServer()).delete(`/tarefas/${tarefa.id}`);
    });

    it.each(['/tarefas', '/categorias'])(
      'GET %s/:id recusa o id com 400',
      async (rota) => {
        const resposta = await request(app.getHttpServer())
          .get(`${rota}/${idGigante}`)
          .expect(400);

        expect(mensagens(resposta.body)).toEqual([mensagemId]);
      },
    );

    it('GET /tarefas recusa o categoriaId do filtro com 400', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/tarefas')
        .query({ categoriaId: idGigante })
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
    });

    it('POST /tarefas recusa o categoriaId com 400', async () => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: `Id gigante ${sufixo}`, categoriaId: idGigante })
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
    });

    it('PATCH /tarefas/:id recusa o categoriaId com 400', async () => {
      const resposta = await request(app.getHttpServer())
        .patch(`/tarefas/${tarefa.id}`)
        .send({ categoriaId: idGigante })
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
    });
  });

  describe('categoriaId inválido', () => {
    let tarefa: Tarefa;

    beforeAll(async () => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: `CategoriaId inválido ${sufixo}` })
        .expect(201);
      tarefa = resposta.body as Tarefa;
    });

    afterAll(async () => {
      await request(app.getHttpServer()).delete(`/tarefas/${tarefa.id}`);
    });

    it.each(['0', '-1', 'abc'])(
      'GET /tarefas?categoriaId=%s responde 400 com uma mensagem em português',
      async (categoriaId) => {
        const resposta = await request(app.getHttpServer())
          .get('/tarefas')
          .query({ categoriaId })
          .expect(400);

        expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
      },
    );

    it.each([0, -1, 4.5, '3'])(
      'POST /tarefas com categoriaId %p responde 400 com uma mensagem em português',
      async (categoriaId) => {
        const resposta = await request(app.getHttpServer())
          .post('/tarefas')
          .send({ titulo: `CategoriaId inválido ${sufixo}`, categoriaId })
          .expect(400);

        expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
      },
    );

    it('PATCH /tarefas/:id com categoriaId 0 responde 400 com uma mensagem em português', async () => {
      const resposta = await request(app.getHttpServer())
        .patch(`/tarefas/${tarefa.id}`)
        .send({ categoriaId: 0 })
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemCategoriaId]);
    });
  });

  describe('id fora do formato decimal', () => {
    let categoria: Categoria;
    let tarefa: Tarefa;
    const hexadecimal = (id: number) => `0x${id.toString(16)}`;

    beforeAll(async () => {
      const respostaCategoria = await request(app.getHttpServer())
        .post('/categorias')
        .send({ nome: `Formato ${sufixo}` })
        .expect(201);
      categoria = respostaCategoria.body as Categoria;

      const respostaTarefa = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo: `Formato ${sufixo}`, categoriaId: categoria.id })
        .expect(201);
      tarefa = respostaTarefa.body as Tarefa;
    });

    afterAll(async () => {
      await request(app.getHttpServer()).delete(`/tarefas/${tarefa.id}`);
      await request(app.getHttpServer()).delete(`/categorias/${categoria.id}`);
    });

    it.each<[string, (id: number) => string]>([
      ['hexadecimal', hexadecimal],
      ['binário', (id) => `0b${id.toString(2)}`],
      ['octal', (id) => `0o${id.toString(8)}`],
      ['notação científica', (id) => `${id}e0`],
      ['casas decimais', (id) => `${id}.0`],
      ['sinal de mais', (id) => `+${id}`],
      ['espaços em volta', (id) => `%20${id}%20`],
    ])('GET /tarefas/:id recusa o id em %s com 400', async (_, formatar) => {
      const resposta = await request(app.getHttpServer())
        .get(`/tarefas/${formatar(tarefa.id)}`)
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemId]);
    });

    it('GET /tarefas/1e3 recusa o id com 400', async () => {
      const resposta = await request(app.getHttpServer())
        .get('/tarefas/1e3')
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemId]);
    });

    it('GET /categorias/:id recusa o id em hexadecimal com 400', async () => {
      const resposta = await request(app.getHttpServer())
        .get(`/categorias/${hexadecimal(categoria.id)}`)
        .expect(400);

      expect(mensagens(resposta.body)).toEqual([mensagemId]);
    });

    it('PATCH e DELETE /tarefas/:id em hexadecimal não mexem na tarefa', async () => {
      const id = hexadecimal(tarefa.id);
      await request(app.getHttpServer())
        .patch(`/tarefas/${id}`)
        .send({ concluida: true })
        .expect(400);
      await request(app.getHttpServer()).delete(`/tarefas/${id}`).expect(400);

      const resposta = await request(app.getHttpServer())
        .get(`/tarefas/${tarefa.id}`)
        .expect(200);
      expect(resposta.body).toEqual(tarefa);
    });

    it('PATCH e DELETE /categorias/:id em hexadecimal não mexem na categoria', async () => {
      const id = hexadecimal(categoria.id);
      await request(app.getHttpServer())
        .patch(`/categorias/${id}`)
        .send({ cor: '#000000' })
        .expect(400);
      await request(app.getHttpServer())
        .delete(`/categorias/${id}`)
        .expect(400);

      const resposta = await request(app.getHttpServer())
        .get(`/categorias/${categoria.id}`)
        .expect(200);
      expect(resposta.body).toEqual(categoria);
    });

    it.each(['0x7fffffff', '1e3', '+5', ' 5', '5.0'])(
      'GET /tarefas?categoriaId=%s recusa o formato com 400',
      async (categoriaId) => {
        const resposta = await request(app.getHttpServer())
          .get('/tarefas')
          .query({ categoriaId })
          .expect(400);

        expect(mensagens(resposta.body)).toContain(mensagemCategoriaId);
      },
    );
  });

  describe('exemplos do Swagger', () => {
    const idsTarefas: number[] = [];

    afterAll(async () => {
      for (const id of idsTarefas) {
        await request(app.getHttpServer()).delete(`/tarefas/${id}`);
      }
    });

    it('o corpo de exemplo do POST /tarefas cria a tarefa sem depender de categoria', async () => {
      const exemplo = exemploDoSchema(
        criarDocumentoSwagger(app),
        'CriarTarefaDto',
      );

      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send(exemplo)
        .expect(201);

      const criada = resposta.body as Tarefa;
      idsTarefas.push(criada.id);
      expect(criada).toMatchObject({ ...exemplo, categoriaId: null });
    });
  });

  describe('busca com % e _', () => {
    const idsTarefas: number[] = [];
    let semCuringa: Tarefa;
    let comCuringa: Tarefa;

    const criarTarefa = async (titulo: string): Promise<Tarefa> => {
      const resposta = await request(app.getHttpServer())
        .post('/tarefas')
        .send({ titulo })
        .expect(201);
      const tarefa = resposta.body as Tarefa;
      idsTarefas.push(tarefa.id);
      return tarefa;
    };

    beforeAll(async () => {
      semCuringa = await criarTarefa(`Busca ${sufixo} sem curinga`);
      comCuringa = await criarTarefa(`Busca_${sufixo} com 100%`);
    });

    afterAll(async () => {
      for (const id of idsTarefas) {
        await request(app.getHttpServer()).delete(`/tarefas/${id}`);
      }
    });

    it.each(['_', '%'])(
      'GET /tarefas?busca=%s procura o caractere como texto',
      async (busca) => {
        const resposta = await request(app.getHttpServer())
          .get('/tarefas')
          .query({ busca })
          .expect(200);

        const ids = (resposta.body as Tarefa[]).map((t) => t.id);
        expect(ids).toContain(comCuringa.id);
        expect(ids).not.toContain(semCuringa.id);
      },
    );
  });
});
