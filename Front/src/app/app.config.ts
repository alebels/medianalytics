import {
  ApplicationConfig,
  LOCALE_ID,
  PLATFORM_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withFetch,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { TranslateLoader, provideTranslateService } from '@ngx-translate/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { InterceptorService } from './interceptors/interceptor.service';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import primeTheme from './utils/prime-theme';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

const httpLoaderFactory: (http: HttpClient) => TranslateHttpLoader = (
  http: HttpClient
) => new TranslateHttpLoader(http, './i18n/', '.json');

registerLocaleData(localeEn, 'en');
registerLocaleData(localeEs, 'es');

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch(), withInterceptorsFromDi()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    {
      provide: LOCALE_ID,
      useFactory: (platformId: object) => {
        if (isPlatformBrowser(platformId)) {
          const userLang = navigator.language?.split('-')[0];
          return userLang === 'en' ? 'en' : 'es';
        }
        return 'en'; // fallback for server-side
      },
      deps: [PLATFORM_ID],
    },
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
    provideTranslateService({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    providePrimeNG({
      theme: {
        preset: primeTheme,
        options: {
          prefix: 'p',
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primeng',
            order: 'tailwind-base, primeng, tailwind-utilities',
          },
        },
      },
    }),
  ],
};
