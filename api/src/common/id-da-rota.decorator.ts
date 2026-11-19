import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiParam } from '@nestjs/swagger';
import type { Request } from 'express';
import { ID_MAXIMO } from './id';
import { ParseIdPipe } from './parse-id.pipe';

const documentarId: ParameterDecorator = (alvo, metodo) => {
  if (metodo === undefined) {
    return;
  }
  const descritor = Object.getOwnPropertyDescriptor(alvo, metodo);
  if (descritor) {
    ApiParam({
      name: 'id',
      schema: { type: 'integer', minimum: 1, maximum: ID_MAXIMO },
    })(alvo, metodo, descritor);
  }
};

const idCruDaRota = createParamDecorator(
  (_: unknown, contexto: ExecutionContext): string =>
    contexto.switchToHttp().getRequest<Request<{ id: string }>>().params.id,
  [documentarId],
);

export const IdDaRota = (): ParameterDecorator =>
  idCruDaRota(new ParseIdPipe());
