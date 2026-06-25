import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { LoginResponse } from '../../../core/auth/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loading = false;
  errorMessage = '';

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  get emailError(): string {
    const control = this.loginForm.get('email');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'El correo es obligatorio';
    if (control.errors['email']) return 'Ingresa un correo válido';
    return '';
  }

  get passwordError(): string {
    const control = this.loginForm.get('password');
    if (!control?.touched || !control.errors) return '';
    if (control.errors['required']) return 'La contraseña es obligatoria';
    if (control.errors['minlength']) return 'Mínimo 6 caracteres';
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.auth
      .login({ email: email!, password: password!, rememberMe: rememberMe! })
      .subscribe({
        next: (response) => this.handleLoginSuccess(response),
        error: (err) => {
          this.loading = false;
          this.errorMessage = err?.message ?? 'Error al iniciar sesión';
        },
      });
  }

  private handleLoginSuccess(response: LoginResponse): void {
    this.loading = false;

    const { usuario } = response;

    if (!usuario?.rol?.id_rol) {
      this.errorMessage = response.mensaje || 'No se pudo iniciar sesión';
      return;
    }
    // Redirigir al usuario a la ruta correspondiente según su rol
    const route = this.auth.getDefaultRouteForUser(usuario);
    // Reemplazar la URL actual en el historial del navegador para evitar que el usuario pueda volver a la página de inicio de sesión
    this.router.navigateByUrl(route, { replaceUrl: true });
  }
}
