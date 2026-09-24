import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HelixAuthService } from '../../../core/auth/helix-auth.service';

@Component({
  selector: 'app-login-prompt',
  imports: [TranslocoPipe],
  templateUrl: './login-prompt.component.html',
})
export class LoginPromptComponent {
  private readonly auth = inject(HelixAuthService);

  isBusy(): boolean {
    return this.auth.status() === 'checking' || this.auth.status() === 'authenticating';
  }

  login(): void {
    void this.auth.login();
  }
}
