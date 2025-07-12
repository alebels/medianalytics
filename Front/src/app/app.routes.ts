import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'filters',
    loadComponent: () => import('./pages/filters/filters.component').then(m => m.FiltersComponent),
  },
  {
    path: 'manifest',
    loadComponent: () => import('./pages/manifest/manifest.component').then(m => m.ManifestComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
