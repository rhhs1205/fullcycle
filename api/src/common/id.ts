export const ID_MAXIMO = 2_147_483_647;

export const APENAS_DIGITOS = /^\d+$/;

export const mensagemIdInvalido = (campo: string): string =>
  `${campo} deve ser um número inteiro entre 1 e ${ID_MAXIMO}`;
