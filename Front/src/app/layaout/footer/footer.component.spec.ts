import { CONTACT_EMAIL, GITHUB_REPO, X_ACCOUNT } from '../../utils/constants';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { environment } from '../../../environments/environment';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FooterComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct githubLink', () => {
    expect(component.githubLink).toBe(GITHUB_REPO);
  });

  it('should have the correct contactEmail', () => {
    expect(component.contactEmail).toBe(CONTACT_EMAIL);
  });

  it('should have the correct xAccount', () => {
    expect(component.xAccount).toBe(X_ACCOUNT);
  });

  it('should have the correct projectVersion from environment', () => {
    expect(component.projectVersion).toBe(environment.projectVersion);
  });
});
