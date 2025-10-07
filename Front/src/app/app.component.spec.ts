import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PrimeNG } from 'primeng/config';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    const translateSpy = {
      use: jest.fn().mockReturnValue(of({})),
      getBrowserLang: jest.fn().mockReturnValue('en'),
      getDefaultLang: jest.fn().mockReturnValue('en'),
      get: jest.fn().mockReturnValue(of({})),
      onLangChange: of({ lang: 'en' })
    };
    
    const primeNGSpy = {
      setTranslation: jest.fn(),
      ripple: jest.fn().mockReturnValue({}),
      overlayOptions: {},
      filterMatchModeOptions: {},
      translation: {}
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: TranslateService, useValue: translateSpy },
        { provide: PrimeNG, useValue: primeNGSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn()
      }
    });
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should have the "Medianalytics" title', () => {
    expect(component.title).toEqual('Medianalytics');
  });

  it('should call checkLanguage on ngOnInit', () => {
    const checkLanguageSpy = jest.spyOn(component as any, 'checkLanguage').mockImplementation(() => undefined);
    
    component.ngOnInit();
    
    expect(checkLanguageSpy).toHaveBeenCalled();
    checkLanguageSpy.mockRestore();
  });

  it('should use preferred language from localStorage if available', () => {
    const preferredLang = 'es';
    (window.localStorage.getItem as jest.Mock).mockReturnValue(preferredLang);
    
    component['checkLanguage']();
    
    expect(translateService.use).toHaveBeenCalledWith(preferredLang);
  });

  it('should use default language when browser language is not Spanish', () => {
    (window.localStorage.getItem as jest.Mock).mockReturnValue(null);
    (translateService.getBrowserLang as jest.Mock).mockReturnValue('fr');
    (translateService.getDefaultLang as jest.Mock).mockReturnValue('en');
    
    component['checkLanguage']();
    
    expect(translateService.use).toHaveBeenCalledWith('en');
  });
});
