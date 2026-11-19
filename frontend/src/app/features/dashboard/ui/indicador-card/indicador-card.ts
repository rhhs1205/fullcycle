import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export type TomIndicador = 'primario' | 'secundario' | 'terciario' | 'sucesso';

@Component({
  selector: 'app-indicador-card',
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card appearance="outlined" class="cartao">
      <div class="icone" [attr.data-tom]="tom()">
        <mat-icon>{{ icone() }}</mat-icon>
      </div>
      <div class="textos">
        <span class="valor">{{ valor() }}</span>
        <span class="rotulo">{{ rotulo() }}</span>
        <ng-content />
      </div>
    </mat-card>
  `,
  styles: `
    .cartao {
      flex-direction: row;
      align-items: center;
      gap: 16px;
      height: 100%;
      padding: 20px;
      box-sizing: border-box;
    }

    .icone {
      display: grid;
      flex: none;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 16px;
    }

    .icone[data-tom='primario'] {
      background: var(--mat-sys-primary-container);
      color: var(--mat-sys-on-primary-container);
    }

    .icone[data-tom='secundario'] {
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .icone[data-tom='terciario'] {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
    }

    .icone[data-tom='sucesso'] {
      background: color-mix(in srgb, #43a047 20%, transparent);
      color: light-dark(#1b5e20, #a5d6a7);
    }

    .textos {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .valor {
      font: var(--mat-sys-headline-medium);
    }

    .rotulo {
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class IndicadorCard {
  readonly icone = input.required<string>();
  readonly valor = input.required<string | number | null>();
  readonly rotulo = input.required<string>();
  readonly tom = input<TomIndicador>('primario');
}
