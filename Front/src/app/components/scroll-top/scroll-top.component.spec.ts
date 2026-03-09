import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ScrollTopComponent } from './scroll-top.component';

describe('ScrollTopComponent', () => {
  let component: ScrollTopComponent;
  let fixture: ComponentFixture<ScrollTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollTopComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ScrollTopComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ScrollTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have windowScrolled false initially', () => {
    expect(component.windowScrolled).toBe(false);
  });

  it('onWindowScroll should set windowScrolled to true when scrollY > 140', () => {
    Object.defineProperty(window, 'scrollY', { value: 200, configurable: true });
    component.onWindowScroll();
    expect(component.windowScrolled).toBe(true);
  });

  it('onWindowScroll should set windowScrolled to false when scrollY <= 140', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    component.onWindowScroll();
    expect(component.windowScrolled).toBe(false);
  });

  it('onWindowScroll should set windowScrolled to false at exactly 140', () => {
    Object.defineProperty(window, 'scrollY', { value: 140, configurable: true });
    component.onWindowScroll();
    expect(component.windowScrolled).toBe(false);
  });

  it('scrollToTop should call window.scrollTo with top 0 and smooth behavior', () => {
    const scrollToSpy = jest.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    component.scrollToTop();
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
