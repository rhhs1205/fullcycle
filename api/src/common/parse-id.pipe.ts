import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { APENAS_DIGITOS, ID_MAXIMO, mensagemIdInvalido } from './id';

@Injectable()
export class ParseIdPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    const id = Number(valor);
    if (!APENAS_DIGITOS.test(valor) || id < 1 || id > ID_MAXIMO) {
      throw new BadRequestException(mensagemIdInvalido('O id'));
    }
    return id;
  }
}
