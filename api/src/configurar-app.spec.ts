import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ExampleObject,
  OpenAPIObject,
  RequestBodyObject,
  SchemaObject,
} from '@nestjs/swagger';
import { before } from '@nestjs/swagger/plugin';
import * as ts from 'typescript';
import { CategoriasController } from './categorias/categorias.controller';
import { CategoriasService } from './categorias/categorias.service';
import { criarDocumentoSwagger } from './configurar-app';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { TarefasController } from './tarefas/tarefas.controller';
import { TarefasService } from './tarefas/tarefas.service';

const METODOS = ['get', 'post', 'patch', 'delete'] as const;

type Metodo = (typeof METODOS)[number];

const referencia = (schema: string) => ({
  content: {
    'application/json': {
      schema: { $ref: `#/components/schemas/${schema}` },
    },
  },
});

const RAIZ_DA_API = join(__dirname, '..');

interface ConfiguracaoNest {
  compilerOptions: {
    plugins: { name: string; options?: Record<string, unknown> }[];
  };
}

const opcoesDoPluginSwagger = (): Record<string, unknown> | undefined => {
  const configuracao = JSON.parse(
    readFileSync(join(RAIZ_DA_API, 'nest-cli.json'), 'utf8'),
  ) as ConfiguracaoNest;
  return configuracao.compilerOptions.plugins.find(
    ({ name }) => name === '@nestjs/swagger',
  )?.options;
};

const camposGeradosPeloPlugin = (arquivo: string, classe: string): string[] => {
  const opcoes =
    ts.getParsedCommandLineOfConfigFile(
      join(RAIZ_DA_API, 'tsconfig.build.json'),
      undefined,
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
    )?.options ?? {};
  const caminho = join(__dirname, arquivo);
  const programa = ts.createProgram([caminho], opcoes);
  const fonte = programa.getSourceFile(caminho);
  if (!fonte) {
    return [];
  }
  const [transformada] = ts.transform<ts.SourceFile>(
    fonte,
    [before(opcoesDoPluginSwagger(), programa)],
    opcoes,
  ).transformed;
  const fabrica = transformada.statements
    .filter(ts.isClassDeclaration)
    .find((declaracao) => declaracao.name?.text === classe)
    ?.members.filter(ts.isMethodDeclaration)
    .find(
      ({ name }) =>
        ts.isIdentifier(name) && name.text === '_OPENAPI_METADATA_FACTORY',
    );
  const retorno = fabrica?.body?.statements.find(ts.isReturnStatement);
  if (
    !retorno?.expression ||
    !ts.isObjectLiteralExpression(retorno.expression)
  ) {
    return [];
  }
  return retorno.expression.properties.flatMap(({ name }) =>
    name && ts.isIdentifier(name) ? [name.text] : [],
  );
};

describe('criarDocumentoSwagger', () => {
  let app: INestApplication;
  let documento: OpenAPIObject;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      controllers: [
        TarefasController,
        CategoriasController,
        DashboardController,
        HealthController,
      ],
      providers: [
        { provide: TarefasService, useValue: {} },
        { provide: CategoriasService, useValue: {} },
        { provide: DashboardService, useValue: {} },
        { provide: HealthService, useValue: {} },
      ],
    }).compile();

    app = modulo.createNestApplication();
    documento = criarDocumentoSwagger(app);
  });

  afterAll(async () => {
    await app.close();
  });

  const schema = (nome: string): SchemaObject =>
    (documento.components?.schemas?.[nome] ?? {}) as SchemaObject;

  const respostas = (metodo: Metodo, caminho: string) =>
    documento.paths[caminho]?.[metodo]?.responses ?? {};

  it.each(['Tarefa', 'Categoria', 'CategoriaComTotalDto'])(
    '%s traz id, criadaEm e atualizadaEm',
    (nome) => {
      expect(schema(nome).properties).toMatchObject({
        id: { type: 'integer' },
        criadaEm: { type: 'string', format: 'date-time' },
        atualizadaEm: { type: 'string', format: 'date-time' },
      });
      expect(schema(nome).required).toEqual(
        expect.arrayContaining(['id', 'criadaEm', 'atualizadaEm']),
      );
    },
  );

  it('não mostra as tarefas dentro da categoria', () => {
    expect(schema('Categoria').properties).not.toHaveProperty('tarefas');
  });

  it('descreve o corpo comum das respostas de erro', () => {
    expect(schema('ErroRespostaDto').properties).toMatchObject({
      statusCode: { type: 'integer' },
      message: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
      },
      error: { type: 'string' },
    });
  });

  it.each<[Metodo, string, string[]]>([
    ['get', '/tarefas', ['400']],
    ['post', '/tarefas', ['400']],
    ['get', '/tarefas/{id}', ['400', '404']],
    ['patch', '/tarefas/{id}', ['400', '404']],
    ['delete', '/tarefas/{id}', ['400', '404']],
    ['post', '/categorias', ['400', '409']],
    ['get', '/categorias/{id}', ['400', '404']],
    ['patch', '/categorias/{id}', ['400', '404', '409']],
    ['delete', '/categorias/{id}', ['400', '404']],
  ])('%s %s documenta os erros %j', (metodo, caminho, erros) => {
    const documentadas = respostas(metodo, caminho);
    for (const status of erros) {
      expect(documentadas[status]).toMatchObject(referencia('ErroRespostaDto'));
    }
  });

  it.each<[Metodo, string]>([
    ['get', '/tarefas/{id}'],
    ['patch', '/tarefas/{id}'],
    ['delete', '/tarefas/{id}'],
    ['get', '/categorias/{id}'],
    ['patch', '/categorias/{id}'],
    ['delete', '/categorias/{id}'],
  ])(
    '%s %s documenta o id como inteiro de 1 a 2147483647',
    (metodo, caminho) => {
      expect(documento.paths[caminho]?.[metodo]?.parameters).toEqual([
        expect.objectContaining({
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1, maximum: 2147483647 },
        }),
      ]);
    },
  );

  it('documenta o categoriaId da criação como inteiro que aceita null, com exemplo null', () => {
    expect(schema('CriarTarefaDto').properties?.categoriaId).toMatchObject({
      type: 'integer',
      minimum: 1,
      maximum: 2147483647,
      nullable: true,
      example: null,
    });
  });

  it('documenta o categoriaId da tarefa como inteiro que aceita null', () => {
    expect(schema('Tarefa').properties?.categoriaId).toMatchObject({
      type: 'integer',
      nullable: true,
    });
  });

  it('documenta o filtro categoriaId como inteiro de 1 a 2147483647', () => {
    expect(documento.paths['/tarefas']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'categoriaId',
          in: 'query',
          schema: expect.objectContaining({
            type: 'integer',
            minimum: 1,
            maximum: 2147483647,
          }) as unknown,
        }),
      ]),
    );
  });

  it.each<[string, string]>([
    ['/tarefas/{id}', 'categoriaId'],
    ['/categorias/{id}', 'nome'],
  ])(
    'o exemplo padrão do PATCH %s muda um campo só e não mexe em %s',
    (caminho, campo) => {
      const corpo = documento.paths[caminho]?.patch?.requestBody as
        RequestBodyObject | undefined;
      const exemplos = Object.values(
        corpo?.content['application/json']?.examples ?? {},
      ) as ExampleObject[];

      expect(exemplos.length).toBeGreaterThan(0);
      const valorPadrao = exemplos[0].value as Record<string, unknown>;
      expect(Object.keys(valorPadrao)).toHaveLength(1);
      expect(valorPadrao).not.toHaveProperty(campo);
    },
  );

  it('documenta o 503 do /health quando o banco está fora', () => {
    expect(respostas('get', '/health')['503']).toMatchObject(
      referencia('StatusIndisponivelDto'),
    );
  });

  it('dá um resumo a cada rota', () => {
    const rotas = Object.entries(documento.paths).flatMap(([caminho, item]) =>
      METODOS.filter((metodo) => item[metodo]).map((metodo) => ({
        rota: `${metodo.toUpperCase()} ${caminho}`,
        resumo: item[metodo]?.summary ?? '',
      })),
    );

    expect(rotas).toHaveLength(12);
    expect(rotas.filter(({ resumo }) => !resumo.trim())).toEqual([]);
  });
});

describe('plugin do Swagger no nest build', () => {
  it('deixa as tarefas fora do schema da categoria', () => {
    const campos = camposGeradosPeloPlugin(
      'categorias/categoria.entity.ts',
      'Categoria',
    );

    expect(campos).toEqual(expect.arrayContaining(['nome', 'cor']));
    expect(campos).not.toContain('tarefas');
  });
});
