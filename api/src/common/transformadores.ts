import { APENAS_DIGITOS } from './id';

export const aparar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export const apararOuNulo = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() || null : value;

export const paraBooleano = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};

export const paraInteiro = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && APENAS_DIGITOS.test(value)
    ? Number(value)
    : value;
