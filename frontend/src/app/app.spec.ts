import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  const renderizar = (): HTMLElement => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('mostra a navbar com o nome do sistema e o status da API', () => {
    const elemento = renderizar();

    expect(elemento.querySelector('app-navbar .marca')?.textContent).toContain('Gestor de Tarefas');
    expect(elemento.querySelector('app-navbar .status')?.textContent).toContain('Verificando API');
  });

  it('mostra os itens de menu na sidebar', () => {
    const elemento = renderizar();

    const itens = Array.from(elemento.querySelectorAll('app-sidebar .menu [matListItemTitle]')).map(
      (item) => item.textContent?.trim(),
    );
    expect(itens).toEqual(['Dashboard', 'Tarefas', 'Categorias']);
  });
});
