import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ADMIN_NAV, CAJERO_NAV, NavItem } from '../../shared/models/nav.model';
import { AuthService } from '../../core/auth/services/auth.service';
import { ROLE_ADMIN } from '../../core/auth/constants/roles';
import { ROUTES } from '../../core/routing/route-paths';
import { ArqueoService } from '../../features/caja/services/arqueo.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  readonly userName: string;
  readonly userRole: string;
  readonly navItems: NavItem[];
  readonly roleLabel: string;
  readonly isAdmin: boolean;
  readonly userInitials: string;
  readonly routes = ROUTES;

  sidebarOpen = false;
  turnoActivo = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private router: Router,
    private arqueoService: ArqueoService
  ) {
    this.userName = this.auth.getUserFullName();
    this.userRole = this.auth.getUserRole();
    this.userInitials = this.getInitials(this.userName);

    this.isAdmin = Number(this.auth.getCurrentUser()?.rol.id_rol) === ROLE_ADMIN;
    this.navItems = this.isAdmin ? ADMIN_NAV : CAJERO_NAV;
    this.roleLabel = this.isAdmin ? 'Administración' : 'Cajero';
  }

  ngOnInit(): void {
    if (this.isAdmin) return;

    this.arqueoService.arqueoActivo$
      .pipe(takeUntil(this.destroy$))
      .subscribe((arqueo) => {
        this.turnoActivo = this.arqueoService.isAbierto(arqueo);
      });

    this.arqueoService.getArqueoActivo().pipe(takeUntil(this.destroy$)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
