import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-nao-encontrada',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <mat-icon class="icone">explore_off</mat-icon>
    <h1>Página não encontrada</h1>
    <p>O endereço que você abriu não existe neste sistema.</p>
    <a mat-flat-button routerLink="/dashboard">Voltar para o dashboard</a>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 64px 16px;
      text-align: center;
    }

    .icone {
      width: 64px;
      height: 64px;
      font-size: 64px;
      color: var(--mat-sys-primary);
    }

    h1 {
      margin: 0;
      font: var(--mat-sys-headline-medium);
    }

    p {
      margin: 0 0 8px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class NaoEncontrada {}
