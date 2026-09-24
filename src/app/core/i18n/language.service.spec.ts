import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageService } from './language.service';
import { LANG_STORAGE_KEY } from './i18n.model';

describe('LanguageService', () => {
  let langChanges$: Subject<string>;
  let setActiveLang: ReturnType<typeof vi.fn>;
  let getActiveLang: ReturnType<typeof vi.fn>;
  let originalLanguage: PropertyDescriptor | undefined;

  function create(): LanguageService {
    langChanges$ = new Subject<string>();
    setActiveLang = vi.fn();
    getActiveLang = vi.fn().mockReturnValue('en');

    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslocoService,
          useValue: { langChanges$, setActiveLang, getActiveLang },
        },
      ],
    });
    return TestBed.inject(LanguageService);
  }

  function setBrowserLanguage(lang: string): void {
    Object.defineProperty(navigator, 'language', { value: lang, configurable: true });
  }

  beforeEach(() => {
    originalLanguage = Object.getOwnPropertyDescriptor(navigator, 'language');
    localStorage.clear();
  });

  afterEach(() => {
    if (originalLanguage) Object.defineProperty(navigator, 'language', originalLanguage);
  });

  it('uses a stored, valid override over the browser language', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'fr');
    setBrowserLanguage('de-DE');
    create().initialize();
    expect(setActiveLang).toHaveBeenCalledWith('fr');
  });

  it('ignores an invalid/stale stored value and falls back to browser detection', () => {
    localStorage.setItem(LANG_STORAGE_KEY, 'es'); // not a supported lang
    setBrowserLanguage('de-CH');
    create().initialize();
    expect(setActiveLang).toHaveBeenCalledWith('de');
  });

  it('maps a supported region-qualified browser language to its base language', () => {
    setBrowserLanguage('it-IT');
    create().initialize();
    expect(setActiveLang).toHaveBeenCalledWith('it');
  });

  it('falls back to English for an unsupported browser language', () => {
    setBrowserLanguage('ja-JP');
    create().initialize();
    expect(setActiveLang).toHaveBeenCalledWith('en');
  });

  it('does not persist an auto-detected language', () => {
    setBrowserLanguage('de-CH');
    create().initialize();
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });

  it('setLanguage() persists the choice and calls TranslocoService', () => {
    const service = create();
    service.setLanguage('fr');
    expect(setActiveLang).toHaveBeenCalledWith('fr');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('fr');
  });

  it('keeps document.documentElement.lang in sync with the active language', async () => {
    create();
    langChanges$.next('de');
    // effect() schedules its run as a microtask; let it flush.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(document.documentElement.lang).toBe('de');
  });
});
