import { Pipe, PipeTransform } from '@angular/core';
import { Prioridade, ROTULO_PRIORIDADE } from '../data/tarefa.model';

@Pipe({ name: 'rotuloPrioridade' })
export class RotuloPrioridadePipe implements PipeTransform {
  transform(prioridade: Prioridade): string {
    return ROTULO_PRIORIDADE[prioridade];
  }
}
