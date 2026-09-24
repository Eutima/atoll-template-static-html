import { Component, inject } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { HelixAuthService } from '../../../core/auth/helix-auth.service';

@Component({
  selector: 'app-access-denied',
  imports: [TranslocoPipe],
  templateUrl: './access-denied.component.html',
})
export class AccessDeniedComponent {
  private readonly auth = inject(HelixAuthService);

  signOut(): void {
    this.auth.logout();
  }
}
