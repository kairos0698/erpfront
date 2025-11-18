import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SessionExpiredService } from '../services/session-expired.service';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule],
  template: `
    <p-dialog 
      [(visible)]="visible" 
      [modal]="true" 
      [closable]="false" 
      [draggable]="false"
      [style]="{ width: '450px' }"
      header="Sesión Expirada">
      <ng-template #content>
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <i class="pi pi-exclamation-triangle text-3xl text-yellow-500"></i>
            <div>
              <p class="text-lg font-semibold mb-2">Tu sesión ha caducado</p>
              <p class="text-gray-400">
                Por seguridad, tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.
              </p>
            </div>
          </div>
        </div>
      </ng-template>
      <ng-template #footer>
        <p-button 
          label="Aceptar" 
          icon="pi pi-check" 
          (onClick)="onAccept()" 
          [style]="{ 'width': '100%' }" />
      </ng-template>
    </p-dialog>
  `
})
export class SessionExpiredModalComponent implements OnInit, OnDestroy {
  visible = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private sessionExpiredService: SessionExpiredService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.sessionExpiredService.sessionExpired$.subscribe(
      (show) => {
        this.visible = show;
      }
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onAccept(): void {
    this.visible = false;
    this.sessionExpiredService.hideSessionExpiredModal();
    // Limpiar tokens y redirigir al login
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

