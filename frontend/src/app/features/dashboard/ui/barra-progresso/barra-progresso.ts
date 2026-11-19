import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-barra-progresso',
  template: `
    <div
      class="preenchimento"
      [style.width.%]="valorLimitado()"
      [style.background]="cor() ?? 'var(--mat-sys-primary)'"
    ></div>
  `,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'valorLimitado()',
    '[attr.aria-label]': 'rotulo()',
  },
  styles: `
    :host {
      display: block;
      height: 8px;
      overflow: hidden;
      border-radius: 999px;
      background: var(--mat-sys-surface-container-highest);
    }

    .preenchimento {
      height: 100%;
      border-radius: inherit;
      transition: width 300ms ease;
    }
  `,
})
export class BarraProgresso {
  readonly rotulo = input.required<string>();
  readonly valor = input(0);
  readonly cor = input<string | null>(null);

  protected readonly valorLimitado = computed(() => Math.min(100, Math.max(0, this.valor())));
}
