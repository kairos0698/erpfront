import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService, RegisterRequest } from '../../../auth.service';

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <div class="register-card">
        <p-card header="Registrarse" styleClass="register-card-content">
          <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
            <div class="field">
              <label for="username">Nombre de Usuario</label>
              <input 
                type="text" 
                id="username" 
                pInputText 
                [(ngModel)]="registerData.username" 
                name="username" 
                required 
                [minlength]="3"
                [ngClass]="{'ng-invalid ng-dirty': registerForm.submitted && (!registerData.username || registerData.username.length < 3)}"
              />
              <small class="p-error" *ngIf="registerForm.submitted && (!registerData.username || registerData.username.length < 3)">
                Nombre de usuario es requerido (mínimo 3 caracteres).
              </small>
            </div>

            <div class="field">
              <label for="email">Email</label>
              <input 
                type="email" 
                id="email" 
                pInputText 
                [(ngModel)]="registerData.email" 
                name="email" 
                required 
                email
                [ngClass]="{'ng-invalid ng-dirty': registerForm.submitted && !registerData.email}"
              />
              <small class="p-error" *ngIf="registerForm.submitted && !registerData.email">
                Email es requerido.
              </small>
            </div>

            <div class="field">
              <label for="password">Contraseña</label>
              <p-password 
                id="password" 
                [(ngModel)]="registerData.password" 
                name="password" 
                required
                [minlength]="6"
                [ngClass]="{'ng-invalid ng-dirty': registerForm.submitted && (!registerData.password || registerData.password.length < 6)}"
                [feedback]="true"
                [toggleMask]="true"
              ></p-password>
              <small class="p-error" *ngIf="registerForm.submitted && (!registerData.password || registerData.password.length < 6)">
                Contraseña es requerida (mínimo 6 caracteres).
              </small>
            </div>

            <div class="field">
              <label for="organizationName">Nombre de la Organización</label>
              <input 
                type="text" 
                id="organizationName" 
                pInputText 
                [(ngModel)]="registerData.organizationName" 
                name="organizationName" 
                required
                [ngClass]="{'ng-invalid ng-dirty': registerForm.submitted && !registerData.organizationName}"
              />
              <small class="p-error" *ngIf="registerForm.submitted && !registerData.organizationName">
                Nombre de la organización es requerido.
              </small>
            </div>

            <div class="field">
              <p-button 
                type="submit" 
                label="Registrarse" 
                icon="pi pi-user-plus" 
                [loading]="loading"
                [disabled]="!registerForm.form.valid"
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
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .register-card {
      width: 100%;
      max-width: 400px;
      padding: 1rem;
    }

    .register-card-content {
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
export class RegisterComponent {
  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    organizationName: ''
  };

  loading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit() {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.registerData).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.router.navigate(['/']);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al registrarse';
        console.error('Register error:', error);
      }
    });
  }
}
