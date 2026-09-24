import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageService } from '../../core/i18n/language.service';
import { AppLang } from '../../core/i18n/i18n.model';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslocoPipe],
  templateUrl: './language-switcher.component.html',
})
export class LanguageSwitcherComponent {
  private readonly languageService = inject(LanguageService);

  readonly activeLang = this.languageService.activeLang;

  // Each language's own native name — shown regardless of the currently
  // active language, so a user can find their language even if they can't
  // read the current UI text.
  readonly languages: { code: AppLang; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
  ];

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as AppLang;
    this.languageService.setLanguage(value);
  }
}
