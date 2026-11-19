import { Component, input } from '@angular/core';
import { Prioridade } from '../../data/tarefa.model';
import { RotuloPrioridadePipe } from '../rotulo-prioridade.pipe';

export const COR_PRIORIDADE: Record<Prioridade, string> = {
  alta: 'var(--mat-sys-error)',
  media: 'var(--mat-sys-tertiary)',
  baixa: 'var(--mat-sys-secondary)',
};

@Component({
  selector: 'app-selo-prioridade',
  imports: [RotuloPrioridadePipe],
  template: `{{ prioridade() | rotuloPrioridade }}`,
  host: {
    '[attr.data-prioridade]': 'prioridade()',
  },
  styles: `
    :host {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font: var(--mat-sys-label-medium);
      white-space: nowrap;
    }

    :host([data-prioridade='alta']) {
      background: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }

    :host([data-prioridade='media']) {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    :host([data-prioridade='baixa']) {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }
  `,
})
export class SeloPrioridade {
  readonly prioridade = input.required<Prioridade>();
}
