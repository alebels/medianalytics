import { Component, OnDestroy, OnInit } from '@angular/core';
import { FooterComponent } from './layaout/footer/footer.component';
import { HeaderComponent } from './layaout/header/header.component';
import { PrimeNG } from 'primeng/config';
import { RouterOutlet } from '@angular/router';
import { ScrollTopComponent } from './components/scroll-top/scroll-top.component';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, HeaderComponent, ScrollTopComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Medianalytics';
  private subscriptions: Subscription[] = [];

  constructor(private trans: TranslateService, private config: PrimeNG) {}

  ngOnInit(): void {
    this.checkLanguage();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) =>
      subscription.unsubscribe()
    );
  }

  private checkLanguage() {
    const preferredLanguage = localStorage.getItem('preferredLanguage');
    if (preferredLanguage) {
      const useSub = this.trans.use(preferredLanguage).subscribe();
      this.subscriptions.push(useSub);
    } else {
      this.trans.use(
        this.trans.getBrowserLang() === 'es'
          ? 'es'
          : this.trans.getDefaultLang()
      );
    }
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.trans
        .get('primeng')
        .subscribe((res) => this.config.setTranslation(res));
    });
    this.subscriptions.push(langChangeSub);
  }
}
