import { TestBed } from '@angular/core/testing';
import { provideTransloco } from '@jsverse/transloco';
import { App } from './app';
import { HelixAuthService } from './core/auth/helix-auth.service';
import { TranslocoHttpLoader } from './core/i18n/transloco.loader';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './core/i18n/i18n.model';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideTransloco({
          config: {
            availableLangs: AVAILABLE_LANGS,
            defaultLang: DEFAULT_LANG,
            fallbackLang: DEFAULT_LANG,
          },
          loader: TranslocoHttpLoader,
        }),
      ],
    }).compileComponents();
    // TestBed.createComponent doesn't run app-level initializers
    // (provideAppInitializer), so resolve the gate explicitly — Helix is
    // unconfigured in this environment, so this settles to 'disabled'.
    await TestBed.inject(HelixAuthService).bootstrap();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, atoll');
  });
});
