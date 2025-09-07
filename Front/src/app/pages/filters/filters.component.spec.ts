import { BehaviorSubject, Subject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { FiltersComponent } from './filters.component';
import { FiltersService } from '../../services/filters.service';
import { GeneralService } from '../../services/general.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MultiSelectModule } from 'primeng/multiselect';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';

// Mock TranslatePipe
@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

class MockTranslateService {
  onLangChange = new Subject<{ lang: string; translations: Record<string, unknown> }>();
  onTranslationChange = of({ lang: 'en', translations: {} });
  onDefaultLangChange = of({ lang: 'en', translations: {} });

  get(key: string) {
    return of(key);
  }

  instant(key: string) {
    return key;
  }
}

class MockFiltersService {
  medias$ = of([]);
  sentiments$ = of([]);
  ideologies$ = of([]);
  mediaCompose$ = of({ countries: [], regions: [], types: [] });

  getTranslatedMediaCompose(): void {
    // Mock implementation
  }

  getTranslatedSentimentsIdeologies(): void {
    // Mock implementation
  }
}

class MockGeneralService {
  isMobile$ = new BehaviorSubject<boolean>(false);
  minMaxDate$ = of({ min_date: '2024-01-01', max_date: '2024-12-31' });
}

describe('FiltersComponent', () => {
  let component: FiltersComponent;
  let fixture: ComponentFixture<FiltersComponent>;
  let filtersService: MockFiltersService;
  let translateService: MockTranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FiltersComponent,
        HttpClientTestingModule,
        MockTranslatePipe,
        MultiSelectModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: FiltersService, useClass: MockFiltersService },
        { provide: GeneralService, useClass: MockGeneralService },
      ],
    }).compileComponents();

    filtersService = TestBed.inject(FiltersService) as unknown as MockFiltersService;
    translateService = TestBed.inject(TranslateService) as unknown as MockTranslateService;

    fixture = TestBed.createComponent(FiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should subscribe to language changes and call translation methods', () => {
    const mediaComposeSpy = jest.spyOn(filtersService, 'getTranslatedMediaCompose');
    const sentimentsSpy = jest.spyOn(filtersService, 'getTranslatedSentimentsIdeologies');

    // Simulate language change
    translateService.onLangChange.next({
      lang: 'fr',
      translations: {},
    });

    // Verify that methods were called at least once
    expect(mediaComposeSpy).toHaveBeenCalled();
    expect(sentimentsSpy).toHaveBeenCalled();
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    const unsubscribeSpies = component['subscriptions'].map((sub) =>
      jest.spyOn(sub, 'unsubscribe')
    );
    component.ngOnDestroy();
    unsubscribeSpies.forEach((spy) => {
      expect(spy).toHaveBeenCalled();
    });
  });

});
