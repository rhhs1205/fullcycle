import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let query: jest.Mock;

  beforeEach(async () => {
    query = jest.fn();
    const modulo = await Test.createTestingModule({
      providers: [HealthService, { provide: DataSource, useValue: { query } }],
    }).compile();

    service = modulo.get(HealthService);
  });

  it('responde ok quando o banco responde', async () => {
    query.mockResolvedValue([{ '?column?': 1 }]);

    await expect(service.verificar()).resolves.toMatchObject({
      status: 'ok',
      banco: 'ok',
    });
  });

  it('responde 503 quando o banco está fora', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.verificar()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
