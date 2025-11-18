import { Directive, Input, ElementRef, Renderer2, OnInit, OnDestroy } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { Subscription } from 'rxjs';

/**
 * Directiva para deshabilitar botones automáticamente cuando hay una carga en progreso
 * Uso: <button appLoadingButton>Guardar</button>
 */
@Directive({
  selector: '[appLoadingButton]',
  standalone: true
})
export class LoadingButtonDirective implements OnInit, OnDestroy {
  private subscription?: Subscription;
  private originalDisabled?: boolean;

  constructor(
    private el: ElementRef<HTMLButtonElement>,
    private renderer: Renderer2,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // Guardar el estado original del botón
    this.originalDisabled = this.el.nativeElement.disabled;

    // Suscribirse a los cambios del estado de carga
    this.subscription = this.loadingService.loading$.subscribe(isLoading => {
      if (isLoading) {
        this.renderer.setProperty(this.el.nativeElement, 'disabled', true);
        this.renderer.addClass(this.el.nativeElement, 'opacity-50');
        this.renderer.addClass(this.el.nativeElement, 'cursor-not-allowed');
      } else {
        // Restaurar el estado original
        this.renderer.setProperty(this.el.nativeElement, 'disabled', this.originalDisabled || false);
        this.renderer.removeClass(this.el.nativeElement, 'opacity-50');
        this.renderer.removeClass(this.el.nativeElement, 'cursor-not-allowed');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

