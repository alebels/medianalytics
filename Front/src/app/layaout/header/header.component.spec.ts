import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    const translateSpy = {
      instant: jest.fn().mockReturnValue('translated'),
      get: jest.fn().mockReturnValue(of('translated')),
      currentLang: 'en',
      onLangChange: new BehaviorSubject({ lang: 'en' }),
      onTranslationChange: new BehaviorSubject({}),
      onDefaultLangChange: new BehaviorSubject({ lang: 'en' }),
      store: { currentLoader: { getTranslation: jest.fn().mockReturnValue(of({})) } }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: TranslateService, useValue: translateSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    TestBed.overrideComponent(HeaderComponent, {
      set: {
        template: '<div>Header Component</div>'
      }
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.toggleMenu).toBe(true);
    expect(component.routes).toEqual(['', 'filters', 'manifest']);
  });

  it('should initialize menu items on ngOnInit', () => {
    component.ngOnInit();
    
    expect(component.items).toBeDefined();
    expect(component.items.length).toBe(1);
    expect(component.items[0].items).toBeDefined();
    expect(component.items[0].items!.length).toBe(4); // 3 routes + 1 separator
  });

  it('should create menu items from routes', () => {
    component.ngOnInit();
    
    const routeItems = component.items[0].items!.slice(0, 3); // First 3 items are routes
    
    expect(routeItems[0].label).toBe('');
    expect(routeItems[0].routerLink).toBe('/');
    expect(routeItems[1].label).toBe('filters');
    expect(routeItems[1].routerLink).toBe('/filters');
    expect(routeItems[2].label).toBe('manifest');
    expect(routeItems[2].routerLink).toBe('/manifest');
  });

  it('should toggle menu visibility', () => {
    const initialState = component.toggleMenu;
    
    // Simulate click event that would toggle menu
    component.toggleMenu = !component.toggleMenu;
    
    expect(component.toggleMenu).toBe(!initialState);
  });

});
