import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService, LoginRequest } from '../../../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    CardModule,
    MessageModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <p-card header="Iniciar Sesión" styleClass="login-card-content">
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <div class="field">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                pInputText 
                [(ngModel)]="loginData.email" 
                name="email" 
                required 
                email
                [ngClass]="{'ng-invalid ng-dirty': loginForm.submitted && !loginData.email}"
              />
              <small class="p-error" *ngIf="loginForm.submitted && !loginData.email">
                Email es requerido.
              </small>
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <p-password 
                id="password" 
                [(ngModel)]="loginData.password" 
                name="password" 
                required
                [ngClass]="{'ng-invalid ng-dirty': loginForm.submitted && !loginData.password}"
                [feedback]="false"
                [toggleMask]="true"
              ></p-password>
              <small class="p-error" *ngIf="loginForm.submitted && !loginData.password">
                Contraseña es requerida.
              </small>
            </div>

            <div class="field">
              <p-button 
                type="submit" 
                label="Iniciar Sesión" 
                icon="pi pi-sign-in" 
                [loading]="loading"
                [disabled]="!loginForm.form.valid"
                styleClass="w-full"
              ></p-button>
            </div>

            <div class="field text-center">
              <p-message 
                *ngIf="errorMessage" 
                severity="error" 
                [text]="errorMessage"
                [closable]="false"
              ></p-message>
            </div>
          </form>
        </p-card>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 1rem;
    }

    .login-card-content {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .field {
      margin-bottom: 1rem;
    }

    .field label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .text-center {
      text-align: center;
    }
  `]
})
export class LoginComponent {
  loginData: LoginRequest = {
    email: '',
    password: ''
  };

  loading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al iniciar sesión';
        console.error('Login error:', error);
      }
    });
  }
}
