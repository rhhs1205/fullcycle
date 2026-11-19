import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cabecalho-pagina',
  template: `
    <div>
      <h1>{{ titulo() }}</h1>
      @if (subtitulo()) {
        <p>{{ subtitulo() }}</p>
      }
    </div>
    <div class="acoes">
      <ng-content />
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    h1 {
      margin: 0;
      font: var(--mat-sys-headline-medium);
    }

    p {
      margin: 4px 0 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .acoes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `,
})
export class CabecalhoPagina {
  readonly titulo = input.required<string>();
  readonly subtitulo = input<string>();
}
