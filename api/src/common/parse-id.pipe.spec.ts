import { BadRequestException } from '@nestjs/common';
import { ParseIdPipe } from './parse-id.pipe';

describe('ParseIdPipe', () => {
  const pipe = new ParseIdPipe();

  it.each([
    ['1', 1],
    ['42', 42],
    ['2147483647', 2147483647],
  ])('converte "%s" no número %d', (valor, id) => {
    expect(pipe.transform(valor)).toBe(id);
  });

  it.each([
    '0',
    '-1',
    '2147483648',
    '99999999999',
    '1.5',
    '3.0',
    '1e3',
    '0x3',
    '0b11',
    '0o3',
    '+3',
    ' 3 ',
    'abc',
    '',
  ])('recusa "%s" com 400 e mensagem em português', (valor) => {
    expect(() => pipe.transform(valor)).toThrow(BadRequestException);
    expect(() => pipe.transform(valor)).toThrow(
      'O id deve ser um número inteiro entre 1 e 2147483647',
    );
  });
});
