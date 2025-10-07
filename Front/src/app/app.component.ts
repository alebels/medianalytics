import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FooterComponent } from './layaout/footer/footer.component';
import { HeaderComponent } from './layaout/header/header.component';
import { PrimeNG } from 'primeng/config';
import { RouterOutlet } from '@angular/router';
import { ScrollTopComponent } from './components/scroll-top/scroll-top.component';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, HeaderComponent, ScrollTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'Medianalytics';

  private trans = inject(TranslateService);
  private config = inject(PrimeNG);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.checkLanguage();
  }

  private checkLanguage(): void {
    const preferredLanguage = localStorage.getItem('preferredLanguage');

    if (preferredLanguage) {
      this.trans
        .use(preferredLanguage)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe();
    } else {
      this.trans.use(
        this.trans.getBrowserLang() === 'es'
          ? 'es'
          : this.trans.getDefaultLang()
      );
    }

    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.trans
          .get('primeng')
          .subscribe((res) => this.config.setTranslation(res));
      });
  }
}
