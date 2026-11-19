import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { CarregamentoService } from '../../services/carregamento.service';
import { StatusApi, StatusApiService } from '../../services/status-api.service';
import { TemaService } from '../../services/tema.service';

interface ApresentacaoStatus {
  rotulo: string;
  icone: string;
  dica: string;
}

const VERIFICAR_AGORA = 'Verificar a API agora';

const APRESENTACAO_STATUS: Record<StatusApi, ApresentacaoStatus> = {
  verificando: { rotulo: 'Verificando API', icone: 'sync', dica: VERIFICAR_AGORA },
  online: { rotulo: 'API online', icone: 'cloud_done', dica: VERIFICAR_AGORA },
  offline: { rotulo: 'API offline', icone: 'cloud_off', dica: VERIFICAR_AGORA },
  'banco-offline': {
    rotulo: 'Banco offline',
    icone: 'storage',
    dica: 'A API está no ar, mas o banco não responde. Ligue o banco com npm run banco e clique para verificar de novo.',
  },
};

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  readonly alternarMenu = output<void>();

  protected readonly tema = inject(TemaService);
  protected readonly carregamento = inject(CarregamentoService);
  protected readonly statusApi = inject(StatusApiService);
  protected readonly status = computed(() => APRESENTACAO_STATUS[this.statusApi.status()]);
}
