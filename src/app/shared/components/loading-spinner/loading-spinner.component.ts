import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule],
  template: `
    <div 
      *ngIf="loadingService.loading$ | async" 
      class="loading-overlay"
      [attr.aria-label]="'Cargando, por favor espere'"
      role="progressbar">
      <div class="loading-container">
        <p-progress-spinner 
          [style]="{ width: '50px', height: '50px' }"
          strokeWidth="8"
          fill="transparent"
          animationDuration=".5s"
          ariaLabel="Cargando">
        </p-progress-spinner>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      backdrop-filter: blur(2px);
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Modo oscuro */
    .app-dark .loading-container {
      background-color: #1e1e1e;
    }
  `]
})
export class LoadingSpinnerComponent implements OnInit {
  constructor(public loadingService: LoadingService) {}

  ngOnInit(): void {
    // El componente se suscribe automáticamente al observable
  }
}

