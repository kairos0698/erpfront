import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$: Observable<boolean> = this.loadingSubject.asObservable();

  private loadingCount = 0;

  /**
   * Activa el spinner de carga
   */
  show(): void {
    this.loadingCount++;
    if (this.loadingCount > 0) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Desactiva el spinner de carga
   */
  hide(): void {
    this.loadingCount--;
    if (this.loadingCount <= 0) {
      this.loadingCount = 0;
      this.loadingSubject.next(false);
    }
  }

  /**
   * Resetea el contador y oculta el spinner
   */
  reset(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Obtiene el estado actual del loading
   */
  get isLoading(): boolean {
    return this.loadingSubject.value;
  }
}

