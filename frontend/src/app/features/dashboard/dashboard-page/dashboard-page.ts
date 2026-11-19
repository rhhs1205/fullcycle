import { DecimalPipe, PercentPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ErroApi } from '../../../core/http/erro.interceptor';
import { CabecalhoPagina } from '../../../shared/ui/cabecalho-pagina/cabecalho-pagina';
import { EstadoErro } from '../../../shared/ui/estado-erro/estado-erro';
import { ChipCategoria } from '../../categorias/ui/chip-categoria/chip-categoria';
import { PRIORIDADES } from '../../tarefas/data/tarefa.model';
import { RotuloPrioridadePipe } from '../../tarefas/ui/rotulo-prioridade.pipe';
import { COR_PRIORIDADE, SeloPrioridade } from '../../tarefas/ui/selo-prioridade/selo-prioridade';
import { DashboardService } from '../data/dashboard.service';
import { Resumo } from '../data/resumo.model';
import { BarraProgresso } from '../ui/barra-progresso/barra-progresso';
import { IndicadorCard } from '../ui/indicador-card/indicador-card';

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DecimalPipe,
    PercentPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CabecalhoPagina,
    EstadoErro,
    ChipCategoria,
    SeloPrioridade,
    RotuloPrioridadePipe,
    BarraProgresso,
    IndicadorCard,
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly dashboardService = inject(DashboardService);

  protected readonly prioridades = PRIORIDADES;
  protected readonly corPrioridade = COR_PRIORIDADE;
  protected readonly resumo = signal<Resumo | null>(null);
  protected readonly erro = signal<string | null>(null);

  protected readonly maiorPendencia = computed(() => {
    const resumo = this.resumo();
    if (!resumo) {
      return 0;
    }
    return Math.max(...PRIORIDADES.map((prioridade) => resumo.pendentesPorPrioridade[prioridade]));
  });

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.erro.set(null);
    this.dashboardService.resumo().subscribe({
      next: (resumo) => this.resumo.set(resumo),
      error: (erro: ErroApi) => this.erro.set(erro.mensagem),
    });
  }

  protected percentual(parte: number, total: number): number {
    return total === 0 ? 0 : Math.round((parte / total) * 100);
  }
}
