import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTooltip } from '@angular/material/tooltip';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { StatusApi, StatusApiService } from '../../services/status-api.service';
import { Navbar } from './navbar';

describe('Navbar', () => {
  let status: WritableSignal<StatusApi>;
  let verificar: jasmine.Spy;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    status = signal<StatusApi>('verificando');
    verificar = jasmine.createSpy('verificar');
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: StatusApiService, useValue: { status, verificar } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Navbar);
    fixture.detectChanges();
  });

  const exibir = (novo: StatusApi): HTMLButtonElement => {
    status.set(novo);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('.status') as HTMLButtonElement;
  };

  const dica = (): string =>
    fixture.debugElement.query(By.css('.status')).injector.get(MatTooltip).message;

  const corDoPonto = (novo: StatusApi): string =>
    getComputedStyle(exibir(novo).querySelector('.ponto')!).backgroundColor;

  it('mostra "Banco offline" e orienta a ligar o banco quando só o banco caiu', () => {
    const botao = exibir('banco-offline');

    expect(botao.textContent).toContain('Banco offline');
    expect(botao.textContent).not.toContain('API offline');
    expect(dica()).toContain('npm run banco');
    expect(dica()).toContain('clique para verificar de novo');
  });

  it('dá ao banco offline uma cor própria no ponto', () => {
    const cores = (['verificando', 'online', 'offline', 'banco-offline'] as StatusApi[]).map(
      corDoPonto,
    );

    expect(new Set(cores).size).toBe(4);
  });

  it('diz "API offline" quando a API não responde', () => {
    const botao = exibir('offline');

    expect(botao.textContent).toContain('API offline');
    expect(dica()).not.toContain('npm run banco');
  });

  it('verifica a API de novo ao clicar no status', () => {
    exibir('banco-offline').click();

    expect(verificar).toHaveBeenCalled();
  });

  describe('acessibilidade', () => {
    const estados: [StatusApi, string][] = [
      ['verificando', 'Verificando API'],
      ['online', 'API online'],
      ['offline', 'API offline'],
      ['banco-offline', 'Banco offline'],
    ];

    it('dá nome ao link da marca, que no celular mostra só o ícone', () => {
      const marca = (fixture.nativeElement as HTMLElement).querySelector('a.marca');

      expect(marca?.getAttribute('aria-label')).toBe('Gestor de Tarefas');
    });

    for (const [estado, rotulo] of estados) {
      it(`dá ao botão de status o nome "${rotulo}" no estado ${estado}`, () => {
        expect(exibir(estado).getAttribute('aria-label')).toBe(rotulo);
      });
    }

    it('mostra um ícone diferente para cada estado, além da cor do ponto', () => {
      const icones = estados.map(([estado]) =>
        exibir(estado).querySelector('mat-icon')?.textContent?.trim(),
      );

      expect(icones.every(Boolean)).withContext(`ícones: ${icones}`).toBeTrue();
      expect(new Set(icones).size).withContext(`ícones: ${icones}`).toBe(estados.length);
    });
  });
});
