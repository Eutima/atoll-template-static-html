import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { HelixAuthService } from '../../../core/auth/helix-auth.service';

@Component({
  selector: 'app-helix-callback',
  imports: [TranslocoPipe],
  templateUrl: './helix-callback.component.html',
})
export class HelixCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(HelixAuthService);

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    void this.auth.handleCallback(params.get('code'), params.get('state'));
  }
}
