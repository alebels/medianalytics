import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
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
    redirectTo: 'home',
  },
];
