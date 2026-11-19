import { Component, input } from '@angular/core';

export interface CategoriaVisivel {
  nome: string;
  cor: string | null;
}

@Component({
  selector: 'app-chip-categoria',
  template: `
    <span class="ponto" [style.background]="categoria()?.cor ?? 'transparent'"></span>
    <span>{{ categoria()?.nome ?? 'Sem categoria' }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font: var(--mat-sys-body-medium);
      white-space: nowrap;
    }

    :host(.sem-categoria) {
      color: var(--mat-sys-on-surface-variant);
    }

    .ponto {
      flex: none;
      width: 10px;
      height: 10px;
      border: 1px solid var(--mat-sys-outline);
      border-radius: 50%;
      box-sizing: border-box;
    }
  `,
  host: {
    '[class.sem-categoria]': '!categoria()',
  },
})
export class ChipCategoria {
  readonly categoria = input<CategoriaVisivel | null>(null);
}
