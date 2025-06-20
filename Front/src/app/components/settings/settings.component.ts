import { Component, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';
import { FormsModule } from '@angular/forms';
import { GITHUB_REPO } from '../../utils/constants';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'app-settings',
  imports: [
    FormsModule,
    CommonModule,
    TranslatePipe,
    ToggleSwitch,
    CardModule,
    DividerModule,
    AccordionModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent implements OnInit {
  githubLink = GITHUB_REPO;
  isDark!: boolean;
  toggleAccordion = true;

  constructor(
    private trans: TranslateService,
  ) {}

  ngOnInit(): void {
    this.checkTheme();
  }

  onChangeDark(): void {
    const element = document.querySelector('html');
    element?.classList.toggle('dark', this.isDark);
    localStorage.setItem('darkTheme', this.isDark.toString());
  }

  setLanguage(lang: string): void {
    if (lang != this.trans.currentLang) {
      this.trans.use(lang);
      localStorage.setItem('preferredLanguage', lang);
    }
  }

  private checkTheme() {
    const darkTheme = localStorage.getItem('darkTheme');
    if (darkTheme) {
      const element = document.querySelector('html');
      this.isDark = darkTheme === 'true';
      element?.classList.toggle('dark', this.isDark);
    } else {
      this.isDark = false;
    }
  }
}
