import { Component, output } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { environment } from '../../../../environments/environment';

interface ItemMenu {
  rota: string;
  icone: string;
  rotulo: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, MatListModule, MatIconModule, MatDividerModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  readonly navegou = output<void>();

  protected readonly urlDocumentacao = `${environment.apiUrl}/docs`;
  protected readonly itens: ItemMenu[] = [
    { rota: '/dashboard', icone: 'dashboard', rotulo: 'Dashboard' },
    { rota: '/tarefas', icone: 'checklist', rotulo: 'Tarefas' },
    { rota: '/categorias', icone: 'label', rotulo: 'Categorias' },
  ];
}
