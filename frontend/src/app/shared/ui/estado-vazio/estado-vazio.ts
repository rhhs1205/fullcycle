import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-estado-vazio',
  imports: [MatIconModule],
  template: `
    <mat-icon class="icone">{{ icone() }}</mat-icon>
    <p class="titulo">{{ titulo() }}</p>
    @if (descricao()) {
      <p class="descricao">{{ descricao() }}</p>
    }
    <ng-content />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 48px 16px;
      text-align: center;
    }

    .icone {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: var(--mat-sys-outline);
    }

    .titulo {
      margin: 0;
      font: var(--mat-sys-title-medium);
    }

    .descricao {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class EstadoVazio {
  readonly icone = input('inbox');
  readonly titulo = input.required<string>();
  readonly descricao = input<string>();
}
