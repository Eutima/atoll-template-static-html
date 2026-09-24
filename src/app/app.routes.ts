import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth/helix/callback',
    loadComponent: () =>
      import('./features/auth/callback/helix-callback.component').then(
        (m) => m.HelixCallbackComponent
      ),
  },
];
