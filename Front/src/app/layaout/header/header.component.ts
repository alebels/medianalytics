import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { RouterLink } from '@angular/router';
import { SettingsComponent } from '../../components/settings/settings.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, TranslatePipe, SettingsComponent, Menu],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  toggleMenu = true;

  routes = ['', 'filters', 'manifest'];

  items!: MenuItem[];

  ngOnInit(): void {
    // Create menu items from routes
    const routeItems = this.routes.map((route: string) => ({
      label: route,
      routerLink: `/${route}`,
    }));

    // Add settings item
    this.items = [
      {
        items: [
          ...routeItems,
          {
            separator: true,
          },
        ],
      },
    ];
  }
}
