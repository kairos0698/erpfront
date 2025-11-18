import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SessionExpiredService {
  private sessionExpiredSubject = new BehaviorSubject<boolean>(false);
  public sessionExpired$ = this.sessionExpiredSubject.asObservable();

  showSessionExpiredModal(): void {
    this.sessionExpiredSubject.next(true);
  }

  hideSessionExpiredModal(): void {
    this.sessionExpiredSubject.next(false);
  }

  isSessionExpired(): boolean {
    return this.sessionExpiredSubject.value;
  }
}

