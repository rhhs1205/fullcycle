import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-estado-erro',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <mat-icon class="icone">cloud_off</mat-icon>
    <p role="alert">{{ mensagem() }}</p>
    <button mat-stroked-button (click)="tentarDeNovo.emit()">
      <mat-icon>refresh</mat-icon>
      Tentar de novo
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 48px 16px;
      text-align: center;
      color: var(--mat-sys-on-surface-variant);
    }

    .icone {
      width: 48px;
      height: 48px;
      font-size: 48px;
      color: var(--mat-sys-error);
    }

    p {
      margin: 0;
      font: var(--mat-sys-body-large);
    }
  `,
})
export class EstadoErro {
  readonly mensagem = input('Não foi possível carregar os dados. Tente de novo em instantes.');
  readonly tentarDeNovo = output<void>();
}
