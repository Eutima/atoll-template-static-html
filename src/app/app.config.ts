import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
  isDevMode,
} from '@angular/core';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideTransloco } from '@jsverse/transloco';
import { HelixAuthService } from './core/auth/helix-auth.service';
import { TranslocoHttpLoader } from './core/i18n/transloco.loader';
import { LanguageService } from './core/i18n/language.service';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './core/i18n/i18n.model';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideTransloco({
      config: {
        availableLangs: AVAILABLE_LANGS,
        defaultLang: DEFAULT_LANG,
        fallbackLang: DEFAULT_LANG,
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => inject(HelixAuthService).bootstrap()),
    provideAppInitializer(() => inject(LanguageService).initialize()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
