import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavItem } from '../../models/nav.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  @Input() roleLabel = '';
  @Input() isAdmin = false;
  @Input() open = false;
  @Output() logoutClick = new EventEmitter<void>();
  @Output() closeMenu = new EventEmitter<void>();

  onNavClick(): void {
    this.closeMenu.emit();
  }
}
