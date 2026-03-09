import { CONTACT_EMAIL, GITHUB_REPO, X_ACCOUNT } from '../../utils/constants';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManifestComponent } from './manifest.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('ManifestComponent', () => {
  let component: ManifestComponent;
  let fixture: ComponentFixture<ManifestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManifestComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ManifestComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ManifestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct contactEmail', () => {
    expect(component.contactEmail).toBe(CONTACT_EMAIL);
  });

  it('should have the correct githubLink', () => {
    expect(component.githubLink).toBe(GITHUB_REPO);
  });

  it('should have the correct xAccount', () => {
    expect(component.xAccount).toBe(X_ACCOUNT);
  });
});
