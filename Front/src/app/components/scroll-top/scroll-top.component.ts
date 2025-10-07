import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-scroll-top',
  templateUrl: './scroll-top.component.html',
  styleUrl: './scroll-top.component.css'
})
export class ScrollTopComponent {
  windowScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.windowScrolled = window.scrollY > 140;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
