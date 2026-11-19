import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Categoria } from '../data/categoria.model';
import { CategoriasService } from '../data/categorias.service';
import { CategoriaFormDialog } from './categoria-form-dialog';

describe('CategoriaFormDialog', () => {
  let fixture: ComponentFixture<CategoriaFormDialog>;

  const montar = async (categoria?: Categoria): Promise<void> => {
    await TestBed.configureTestingModule({
      imports: [CategoriaFormDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { categoria } },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: CategoriasService, useValue: {} },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CategoriaFormDialog);
    fixture.detectChanges();
  };

  const amostras = (): HTMLButtonElement[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.paleta [role="radio"]',
      ),
    );

  const corEscolhida = (): string | null | undefined =>
    amostras()
      .find((amostra) => amostra.getAttribute('aria-checked') === 'true')
      ?.getAttribute('aria-label');

  const pressionar = (tecla: string): void => {
    document.activeElement?.dispatchEvent(
      new KeyboardEvent('keydown', { key: tecla, bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  };

  it('deixa só a cor escolhida na ordem do Tab', async () => {
    await montar();

    expect(amostras().map((amostra) => amostra.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1, -1]);
  });

  it('troca a cor com as setas e volta para o fim ao passar do começo', async () => {
    await montar();
    amostras()[0].focus();

    pressionar('ArrowRight');
    expect(corEscolhida()).toBe('Verde');
    expect(document.activeElement).toBe(amostras()[1]);

    pressionar('ArrowUp');
    pressionar('ArrowLeft');
    expect(corEscolhida()).toBe('Cinza');
    expect(document.activeElement).toBe(amostras()[7]);
    expect(amostras()[7].tabIndex).toBe(0);

    pressionar('ArrowDown');
    expect(corEscolhida()).toBe('Azul');
    expect(document.activeElement).toBe(amostras()[0]);
  });

  it('mantém a paleta no Tab quando a cor atual não está entre as opções', async () => {
    await montar({ id: 1, nome: 'Outra', cor: '#123456', criadaEm: '', atualizadaEm: '' });

    expect(corEscolhida()).toBeUndefined();
    expect(amostras().map((amostra) => amostra.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1, -1]);
  });
});
