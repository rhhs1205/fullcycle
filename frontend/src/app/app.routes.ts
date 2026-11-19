import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'tarefas',
    title: 'Tarefas',
    loadComponent: () =>
      import('./features/tarefas/tarefas-page/tarefas-page').then((m) => m.TarefasPage),
  },
  {
    path: 'categorias',
    title: 'Categorias',
    loadComponent: () =>
      import('./features/categorias/categorias-page/categorias-page').then((m) => m.CategoriasPage),
  },
  {
    path: '**',
    title: 'Página não encontrada',
    loadComponent: () =>
      import('./core/pages/nao-encontrada/nao-encontrada').then((m) => m.NaoEncontrada),
  },
];
