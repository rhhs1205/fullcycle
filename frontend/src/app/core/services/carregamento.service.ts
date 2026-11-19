import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CarregamentoService {
  private readonly pendentes = signal(0);

  readonly ativo = computed(() => this.pendentes() > 0);

  iniciar(): void {
    this.pendentes.update((total) => total + 1);
  }

  finalizar(): void {
    this.pendentes.update((total) => Math.max(0, total - 1));
  }
}
