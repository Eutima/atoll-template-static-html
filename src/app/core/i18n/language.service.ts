import { Injectable, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { AppLang, DEFAULT_LANG, LANG_STORAGE_KEY, isAppLang } from './i18n.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly transloco = inject(TranslocoService);

  // Transloco already owns canonical "current language" state; wrap its
  // own observable rather than keeping a second, independently-updated
  // signal that could drift out of sync with it.
  private readonly langSignal = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  });
  readonly activeLang = computed(() => this.langSignal() as AppLang);

  constructor() {
    effect(() => {
      document.documentElement.lang = this.activeLang();
    });
  }

  /** Called once at app startup (see provideAppInitializer in app.config.ts). */
  initialize(): void {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (isAppLang(stored)) {
      this.transloco.setActiveLang(stored);
      return;
    }

    const browserLang = (navigator.language || '').split('-')[0].toLowerCase();
    this.transloco.setActiveLang(isAppLang(browserLang) ? browserLang : DEFAULT_LANG);
  }

  setLanguage(lang: AppLang): void {
    this.transloco.setActiveLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  }
}
