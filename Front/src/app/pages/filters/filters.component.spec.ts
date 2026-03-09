import { BehaviorSubject, Subject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { dataChartDialog$, isShowChartDialog$, isShowFiltersDialog$ } from '../../utils/dialog-subjects';
import { ChartDialog } from '../../models/dialog.model';
import { FiltersComponent } from './filters.component';
import { FiltersService } from '../../services/filters.service';
import { GeneralService } from '../../services/general.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SentimentIdeologyService } from '../../services/sentiment-ideology.service';
import { TranslateService } from '@ngx-translate/core';

class MockTranslateService {
  onLangChange = new Subject<{ lang: string; translations: Record<string, unknown> }>();
  onTranslationChange = of({ lang: 'en', translations: {} });
  onDefaultLangChange = of({ lang: 'en', translations: {} });
  get = jest.fn((key: string) => of(key));
  instant = jest.fn((key: string) => key);
}

class MockFiltersService {
  mediaRead$ = of([]);
  medias$ = of([]);
  mediaCompose$ = of({ countries: [], regions: [], types: [] });
  getTranslatedMediaCompose = jest.fn();
}

class MockSentimentIdeologyService {
  sentiments$ = new BehaviorSubject({ sentiments: [] });
  ideologies$ = new BehaviorSubject({ ideologies: [] });
  getTranslatedSentimentsIdeologies = jest.fn();
}

class MockGeneralService {
  isMobile$ = new BehaviorSubject<boolean>(false);
  minMaxDate$ = of({ min_date: '2024-01-01', max_date: '2024-12-31' });
}

describe('FiltersComponent', () => {
  let component: FiltersComponent;
  let fixture: ComponentFixture<FiltersComponent>;
  let mockFiltersService: MockFiltersService;
  let mockSentimentService: MockSentimentIdeologyService;
  let mockTranslateService: MockTranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersComponent],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: FiltersService, useClass: MockFiltersService },
        { provide: SentimentIdeologyService, useClass: MockSentimentIdeologyService },
        { provide: GeneralService, useClass: MockGeneralService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FiltersComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    mockFiltersService = TestBed.inject(FiltersService) as unknown as MockFiltersService;
    mockSentimentService = TestBed.inject(SentimentIdeologyService) as unknown as MockSentimentIdeologyService;
    mockTranslateService = TestBed.inject(TranslateService) as unknown as MockTranslateService;

    fixture = TestBed.createComponent(FiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getTranslatedMediaCompose on init', () => {
    expect(mockFiltersService.getTranslatedMediaCompose).toHaveBeenCalled();
  });

  it('should call getTranslatedSentimentsIdeologies on init', () => {
    expect(mockSentimentService.getTranslatedSentimentsIdeologies).toHaveBeenCalled();
  });

  it('should set isMobile from GeneralService on init', () => {
    expect(component.isMobile).toBe(false);
  });

  it('should re-translate on language change', () => {
    mockFiltersService.getTranslatedMediaCompose.mockClear();
    mockSentimentService.getTranslatedSentimentsIdeologies.mockClear();

    mockTranslateService.onLangChange.next({ lang: 'es', translations: {} });

    expect(mockFiltersService.getTranslatedMediaCompose).toHaveBeenCalled();
    expect(mockSentimentService.getTranslatedSentimentsIdeologies).toHaveBeenCalled();
  });

  it('isShowFiltersDialog should update when isShowFiltersDialog$ emits true', () => {
    isShowFiltersDialog$.next(true);
    expect(component.isShowFiltersDialog()).toBe(true);
  });

  it('isShowFiltersDialog should update when isShowFiltersDialog$ emits false', () => {
    isShowFiltersDialog$.next(true);
    isShowFiltersDialog$.next(false);
    expect(component.isShowFiltersDialog()).toBe(false);
  });

  it('isShowChartDialog should update when isShowChartDialog$ emits true', () => {
    isShowChartDialog$.next(true);
    expect(component.isShowChartDialog()).toBe(true);
  });

  it('dataChartDialog should update when dataChartDialog$ emits', () => {
    const newDialog = new ChartDialog();
    newDialog.count.set(5);
    dataChartDialog$.next(newDialog);
    expect(component.dataChartDialog().count()).toBe(5);
  });
});
