import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { ManifestComponent } from './manifest.component';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

// Mock TranslatePipe
@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

// Mock TranslateService
class MockTranslateService {
  get(key: string) {
    return of(key);
  }
  
  onLangChange = of({ lang: 'en', translations: {} });
  onTranslationChange = of({ lang: 'en', translations: {} });
  onDefaultLangChange = of({ lang: 'en', translations: {} });
  
  instant(key: string) {
    return key;
  }
  
  use(lang: string) {
    console.log(`Language set to: ${lang}`);
    return of({});
  }
}

describe('ManifestComponent', () => {
  let component: ManifestComponent;
  let fixture: ComponentFixture<ManifestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManifestComponent, MockTranslatePipe],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManifestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
