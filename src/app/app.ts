import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HelixAuthService } from './core/auth/helix-auth.service';
import { LoginPromptComponent } from './features/auth/login-prompt/login-prompt.component';
import { AccessDeniedComponent } from './features/auth/access-denied/access-denied.component';
import { LanguageSwitcherComponent } from './shared/language-switcher/language-switcher.component';

const CALLBACK_PATH = '/auth/helix/callback';

@Component({
  imports: [RouterOutlet, LoginPromptComponent, AccessDeniedComponent, LanguageSwitcherComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly auth = inject(HelixAuthService);
  private readonly router = inject(Router);

  protected readonly title = signal('atoll');

  private readonly isCallbackRoute = signal(this.router.url.startsWith(CALLBACK_PATH));

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isCallbackRoute.set(event.urlAfterRedirects.startsWith(CALLBACK_PATH));
      }
    });
  }

  // App-wide gate: the callback route must always be reachable so it can
  // finish the token exchange, even while the rest of the app is gated.
  protected readonly showApp = computed(
    () =>
      this.auth.status() === 'disabled' ||
      this.auth.status() === 'authenticated' ||
      this.isCallbackRoute()
  );

  protected readonly showDenied = computed(
    () => this.auth.status() === 'denied' && !this.isCallbackRoute()
  );
}
