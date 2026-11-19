import { ValidateBy, ValidateIf, ValidationOptions } from 'class-validator';
import { ID_MAXIMO, mensagemIdInvalido } from './id';

export const OpcionalNaoNulo = (): PropertyDecorator =>
  ValidateIf((_, valor) => valor !== undefined);

export const EhId = (opcoes?: ValidationOptions): PropertyDecorator =>
  ValidateBy(
    {
      name: 'ehId',
      validator: {
        validate: (valor: unknown) =>
          Number.isInteger(valor) &&
          (valor as number) >= 1 &&
          (valor as number) <= ID_MAXIMO,
        defaultMessage: () => mensagemIdInvalido('$property'),
      },
    },
    opcoes,
  );
