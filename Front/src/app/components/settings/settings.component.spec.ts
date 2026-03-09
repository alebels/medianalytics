import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GITHUB_REPO, X_ACCOUNT } from '../../utils/constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SettingsComponent } from './settings.component';
import { TranslateService } from '@ngx-translate/core';

class MockTranslateService {
  currentLang = 'en';
  use = jest.fn();
}

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockTranslate: MockTranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [{ provide: TranslateService, useClass: MockTranslateService }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SettingsComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    mockTranslate = TestBed.inject(TranslateService) as unknown as MockTranslateService;

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have githubLink and xAccount set from constants', () => {
    expect(component.githubLink).toBe(GITHUB_REPO);
    expect(component.xAccount).toBe(X_ACCOUNT);
  });

  it('checkTheme should set isDark to false when no stored theme', () => {
    localStorage.removeItem('darkTheme');
    component.ngOnInit();
    expect(component.isDark).toBe(false);
  });

  it('checkTheme should set isDark to true when stored darkTheme is "true"', () => {
    localStorage.setItem('darkTheme', 'true');
    component.ngOnInit();
    expect(component.isDark).toBe(true);
  });

  it('checkTheme should set isDark to false when stored darkTheme is "false"', () => {
    localStorage.setItem('darkTheme', 'false');
    component.ngOnInit();
    expect(component.isDark).toBe(false);
  });

  it('onChangeDark should store isDark=true in localStorage', () => {
    component.isDark = true;
    component.onChangeDark();
    expect(localStorage.getItem('darkTheme')).toBe('true');
  });

  it('onChangeDark should store isDark=false in localStorage', () => {
    component.isDark = false;
    component.onChangeDark();
    expect(localStorage.getItem('darkTheme')).toBe('false');
  });

  it('setLanguage should call trans.use and store preferredLanguage when lang differs', () => {
    mockTranslate.currentLang = 'en';
    component.setLanguage('es');
    expect(mockTranslate.use).toHaveBeenCalledWith('es');
    expect(localStorage.getItem('preferredLanguage')).toBe('es');
  });

  it('setLanguage should not call trans.use when same language is already active', () => {
    mockTranslate.currentLang = 'en';
    component.setLanguage('en');
    expect(mockTranslate.use).not.toHaveBeenCalled();
  });
});
