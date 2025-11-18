import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionExpiredModalComponent } from './app/core/components/session-expired-modal.component';
import { LoadingSpinnerComponent } from './app/shared/components/loading-spinner/loading-spinner.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, SessionExpiredModalComponent, LoadingSpinnerComponent],
    template: `
        <router-outlet></router-outlet>
        <app-session-expired-modal></app-session-expired-modal>
        <app-loading-spinner></app-loading-spinner>
    `
})
export class AppComponent {}
