import { Component } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  breadcrumbs: Array<{ label: string, url: string }> = [];

  constructor(private activatedRoute: ActivatedRoute, private router: Router) { }

  ngOnInit(): void {
    // Subscribe to the router events to get updates on the current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateBreadcrumbs(this.activatedRoute.root);
    });
  }

  // Update breadcrumb logic based on the activated route
  private updateBreadcrumbs(route: ActivatedRoute, url: string = '') {
    // Get child routes
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return;
    }

    children.forEach(child => {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL) {
        this.breadcrumbs.push({ label: routeURL, url: `${url}/${routeURL}` });
      }
      this.updateBreadcrumbs(child, `${url}/${routeURL}`);
    });
  }
}
