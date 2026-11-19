import { OverlayContainer } from '@angular/cdk/overlay';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CategoriaComTotal } from '../data/categoria.model';
import { CategoriasService } from '../data/categorias.service';
import { CategoriasPage } from './categorias-page';

const novaCategoria = (dados: Partial<CategoriaComTotal>): CategoriaComTotal => ({
  id: 1,
  nome: 'Estudos',
  cor: '#1e88e5',
  totalTarefas: 0,
  criadaEm: '',
  atualizadaEm: '',
  ...dados,
});

const botao = (raiz: ParentNode, texto: string): HTMLButtonElement => {
  const encontrado = Array.from(raiz.querySelectorAll('button')).find((item) =>
    item.textContent?.includes(texto),
  );
  if (!encontrado) {
    throw new Error(`Botão "${texto}" não encontrado`);
  }
  return encontrado;
};

describe('CategoriasPage', () => {
  let criar: jasmine.Spy;

  const montar = async (
    categorias: CategoriaComTotal[],
  ): Promise<ComponentFixture<CategoriasPage>> => {
    criar = jasmine.createSpy('criar');
    await TestBed.configureTestingModule({
      imports: [CategoriasPage],
      providers: [
        provideRouter([]),
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: CategoriasService, useValue: { listar: () => of(categorias), criar } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CategoriasPage);
    fixture.detectChanges();
    return fixture;
  };

  const configurar = async (categorias: CategoriaComTotal[]): Promise<HTMLElement> =>
    (await montar(categorias)).nativeElement as HTMLElement;

  const estabilizar = async (fixture: ComponentFixture<CategoriasPage>): Promise<void> => {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const sobreposicao = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();

  it('mostra um cartão por categoria com o total de tarefas', async () => {
    const elemento = await configurar([
      novaCategoria({ id: 1, nome: 'Casa', totalTarefas: 0 }),
      novaCategoria({ id: 2, nome: 'Estudos', totalTarefas: 1 }),
      novaCategoria({ id: 3, nome: 'Trabalho', totalTarefas: 4 }),
    ]);

    const subtitulos = Array.from(elemento.querySelectorAll('mat-card-subtitle')).map((item) =>
      item.textContent?.trim(),
    );
    expect(subtitulos).toEqual(['Nenhuma tarefa', '1 tarefa', '4 tarefas']);
  });

  it('leva para as tarefas filtradas pela categoria', async () => {
    const elemento = await configurar([novaCategoria({ id: 7 })]);

    const link = elemento.querySelector('a[href*="tarefas"]');
    expect(link?.getAttribute('href')).toBe('/tarefas?categoria=7');
  });

  it('convida a criar a primeira categoria quando não há nenhuma', async () => {
    const elemento = await configurar([]);

    expect(elemento.textContent).toContain('Nenhuma categoria ainda');
  });

  describe('aviso de exclusão', () => {
    const avisoAoExcluir = async (totalTarefas: number): Promise<string | undefined> => {
      const fixture = await montar([novaCategoria({ nome: 'Estudos', totalTarefas })]);

      (fixture.nativeElement as HTMLElement)
        .querySelector<HTMLButtonElement>('button[aria-label="Excluir Estudos"]')!
        .click();
      await estabilizar(fixture);

      return sobreposicao().querySelector('mat-dialog-content')?.textContent?.trim();
    };

    it('fala da tarefa no singular quando a categoria tem uma', async () => {
      expect(await avisoAoExcluir(1)).toBe(
        'Excluir "Estudos"? A única tarefa dela vai ficar sem categoria.',
      );
    });

    it('fala das tarefas no plural quando a categoria tem várias', async () => {
      expect(await avisoAoExcluir(4)).toBe(
        'Excluir "Estudos"? As 4 tarefas dela vão ficar sem categoria.',
      );
    });

    it('não fala de tarefas quando a categoria está vazia', async () => {
      expect(await avisoAoExcluir(0)).toBe('Excluir "Estudos"?');
    });
  });

  describe('formulário de categoria', () => {
    it('não mostra aviso nenhum ao cancelar a nova categoria', async () => {
      const fixture = await montar([]);
      const abrir = spyOn(TestBed.inject(MatDialog), 'open').and.callThrough();
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova categoria').click();
      await estabilizar(fixture);
      let resultado: unknown = 'diálogo ainda aberto';
      abrir.calls
        .mostRecent()
        .returnValue.afterClosed()
        .subscribe((valor) => (resultado = valor));
      botao(sobreposicao(), 'Cancelar').click();
      await estabilizar(fixture);

      expect(sobreposicao().querySelector('mat-dialog-container')).toBeNull();
      expect(resultado).toBeUndefined();
      expect(aviso).not.toHaveBeenCalled();
    });

    it('não mostra aviso quando o diálogo fecha sem devolver a categoria salva', async () => {
      const fixture = await montar([]);
      const dialogo = TestBed.inject(MatDialog);
      spyOn(dialogo, 'open').and.returnValue({
        afterClosed: () => of(''),
      } as ReturnType<typeof dialogo.open>);
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova categoria').click();

      expect(aviso).not.toHaveBeenCalled();
    });

    it('avisa que a categoria foi criada depois de salvar', async () => {
      const fixture = await montar([]);
      criar.and.returnValue(of(novaCategoria({ id: 5, nome: 'Saúde' })));
      const aviso = spyOn(TestBed.inject(MatSnackBar), 'open');

      botao(fixture.nativeElement, 'Nova categoria').click();
      await estabilizar(fixture);
      const nome = sobreposicao().querySelector<HTMLInputElement>('input[formcontrolname="nome"]')!;
      nome.value = 'Saúde';
      nome.dispatchEvent(new Event('input'));
      botao(sobreposicao(), 'Salvar').click();
      await estabilizar(fixture);

      expect(criar).toHaveBeenCalledWith(jasmine.objectContaining({ nome: 'Saúde' }));
      expect(aviso).toHaveBeenCalledOnceWith('Categoria criada.', 'OK');
    });
  });
});
