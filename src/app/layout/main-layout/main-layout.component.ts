import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ADMIN_NAV, CAJERO_NAV, NavItem } from '../../shared/models/nav.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { ROLE_ADMIN } from '../../core/auth/constants/roles';
import { ROUTES } from '../../core/routing/route-paths';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent {
  readonly userName: string;
  readonly userRole: string;
  readonly navItems: NavItem[];
  readonly roleLabel: string;
  readonly isAdmin: boolean;
  readonly userInitials: string;

  sidebarOpen = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {
    this.userName = this.auth.getUserFullName();
    this.userRole = this.auth.getUserRole();
    this.userInitials = this.getInitials(this.userName);

    this.isAdmin = Number(this.auth.getCurrentUser()?.rol.id_rol) === ROLE_ADMIN;
    this.navItems = this.isAdmin ? ADMIN_NAV : CAJERO_NAV;
    this.roleLabel = this.isAdmin ? 'Administración' : 'Cajero';
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate([ROUTES.LOGIN]);
  }

  private getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    return parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  }
}
