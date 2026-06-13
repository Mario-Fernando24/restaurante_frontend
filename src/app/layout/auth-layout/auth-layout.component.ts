import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment } from '../../../environments/environment';

// Layout de pantallas públicas: login, recuperar clave, etc.
// Tiene un <router-outlet> interno donde Angular muestra la ruta hija (LoginComponent)
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet], // necesario para usar <router-outlet> en el HTML
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss'],
})
export class AuthLayoutComponent {
  readonly appVersion = environment.appVersion;
  readonly currentYear = new Date().getFullYear();
}
