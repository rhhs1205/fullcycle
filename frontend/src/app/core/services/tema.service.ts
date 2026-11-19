import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

const CHAVE_TEMA = 'tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  private readonly documento = inject(DOCUMENT);

  readonly escuro = signal(this.lerPreferencia());

  constructor() {
    effect(() => {
      const escuro = this.escuro();
      this.documento.documentElement.style.colorScheme = escuro ? 'dark' : 'light';
      localStorage.setItem(CHAVE_TEMA, escuro ? 'escuro' : 'claro');
    });
  }

  alternar(): void {
    this.escuro.update((escuro) => !escuro);
  }

  private lerPreferencia(): boolean {
    const salvo = localStorage.getItem(CHAVE_TEMA);
    if (salvo) {
      return salvo === 'escuro';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
