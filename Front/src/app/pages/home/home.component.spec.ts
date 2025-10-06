import { BehaviorSubject, Subject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompoundDataCharts, DataChart } from '../../models/chart.model';
import { DataCountTable, GeneralMediaTable } from '../../models/table.model';
import { Pipe, PipeTransform } from '@angular/core';
import { GeneralService } from '../../services/general.service';
import { HomeComponent } from './home.component';
import { HomeService } from '../../services/home.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MinMaxDateRead } from '../../models/items.model';
import { NO_DATA } from '../../utils/constants';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

class MockTranslateService {
  currentLang = 'en';
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

class MockHomeService {
  generalTotalMedias$ = of(0);
  generalTotalArticles$ = of(0);
  generalTotalWords$ = of(0);
  generalAverageWord$ = of(0);
  generalTopWords$ = of(new DataChart());
  generalBottomWords$ = of(new DataCountTable());
  generalSentiments$ = of(new CompoundDataCharts());
  generalIdeologies$ = of(new CompoundDataCharts());
  generalTopGrammar$ = of(new DataChart());
  generalTableSub$ = of(new GeneralMediaTable());
  generalDayTopWords$ = of(new DataChart());
  generalDaySentiments$ = of(new CompoundDataCharts());
  generalDayIdeologies$ = of(new CompoundDataCharts());
}

class MockGeneralService {
  isMobile$ = new BehaviorSubject<boolean>(false);
  minMaxDate$ = of(new MinMaxDateRead('2024-01-01', '2024-12-31'));
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let homeService: MockHomeService;
  let generalService: MockGeneralService;
  let translateService: MockTranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, HttpClientTestingModule, NoopAnimationsModule, MockTranslatePipe],
      providers: [
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: HomeService, useClass: MockHomeService },
        { provide: GeneralService, useClass: MockGeneralService },
      ],
    });

    homeService = TestBed.inject(HomeService) as unknown as MockHomeService;
    generalService = TestBed.inject(GeneralService) as unknown as MockGeneralService;
    translateService = TestBed.inject(TranslateService) as unknown as MockTranslateService;

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.generalTotalMedias).toBe(0);
    expect(component.isMobile).toBe(false);
  });

  it('should initialize all data properties from services', () => {
    expect(component.generalTotalMedias).toBe(0);
    expect(component.generalTotalArticles).toBe(0);
    expect(component.generalTotalWords).toBe(0);
    expect(component.generalAverageWords).toBe(0);
    expect(component.generalTopWords).toBeInstanceOf(DataChart);
    expect(component.generalBottomWords).toBeInstanceOf(DataCountTable);
    expect(component.generalSentiments).toBeInstanceOf(CompoundDataCharts);
    expect(component.generalIdeologies).toBeInstanceOf(CompoundDataCharts);
    expect(component.generalTopGrammar).toBeInstanceOf(DataChart);
    expect(component.generalTable).toBeInstanceOf(GeneralMediaTable);
    expect(component.generalDayTopWords).toBeInstanceOf(DataChart);
    expect(component.generalDaySentiments).toBeInstanceOf(CompoundDataCharts);
    expect(component.generalDayIdeologies).toBeInstanceOf(CompoundDataCharts);
  });

  it('should set min and max dates from service', () => {
    expect(component.minDate).toEqual(new Date('2024-01-01'));
    expect(component.maxDate).toEqual(new Date('2024-12-31'));
  });

  it('should set current language from translate service', () => {
    expect(component.currentLang).toBe('en');
  });

  it('should update current language when language changes', () => {
    translateService.onLangChange.next({ lang: 'es', translations: {} });
    expect(component.currentLang).toBe('es');
  });

  it('should update data when services emit new values', () => {
    const testChart = new DataChart(['test'], [{ name: 'test', data: [1, 2, 3] }]);
    const testTable = new DataCountTable([{ name: 'test', count: 5 }]);
    const testCompound = new CompoundDataCharts(testChart, testChart);
    const testGeneralTable = new GeneralMediaTable([]);

    homeService.generalTotalMedias$ = of(10);
    homeService.generalTotalArticles$ = of(20);
    homeService.generalTotalWords$ = of(30);
    homeService.generalAverageWord$ = of(40);
    homeService.generalTopWords$ = of(testChart);
    homeService.generalBottomWords$ = of(testTable);
    homeService.generalSentiments$ = of(testCompound);
    homeService.generalIdeologies$ = of(testCompound);
    homeService.generalTopGrammar$ = of(testChart);
    homeService.generalTableSub$ = of(testGeneralTable);
    homeService.generalDayTopWords$ = of(testChart);
    homeService.generalDaySentiments$ = of(testCompound);
    homeService.generalDayIdeologies$ = of(testCompound);

    // Create new component to test updated values
    const newFixture = TestBed.createComponent(HomeComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.generalTotalMedias).toBe(10);
    expect(newComponent.generalTotalArticles).toBe(20);
    expect(newComponent.generalTotalWords).toBe(30);
    expect(newComponent.generalAverageWords).toBe(40);
    expect(newComponent.generalTopWords).toEqual(testChart);
    expect(newComponent.generalBottomWords).toEqual(testTable);
    expect(newComponent.generalSentiments).toEqual(testCompound);
    expect(newComponent.generalIdeologies).toEqual(testCompound);
    expect(newComponent.generalTopGrammar).toEqual(testChart);
    expect(newComponent.generalTable).toEqual(testGeneralTable);
    expect(newComponent.generalDayTopWords).toEqual(testChart);
    expect(newComponent.generalDaySentiments).toEqual(testCompound);
    expect(newComponent.generalDayIdeologies).toEqual(testCompound);
  });

  it('should handle mobile detection correctly', () => {
    generalService.isMobile$.next(true);
    
    const newFixture = TestBed.createComponent(HomeComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    expect(newComponent.isMobile).toBe(true);
  });

  it('should initialize noData object correctly', () => {
    expect(component.noData).toBeDefined();
    expect(component.noData.type).toBe(NO_DATA.LOADING_HOME);
  });

  it('should handle null minMaxDate from service', () => {
    generalService.minMaxDate$ = of(null as any);
    
    const newFixture = TestBed.createComponent(HomeComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();

    // When minMaxDate is null, currentLang should not be set
    expect(newComponent.currentLang).toBeUndefined();
  });

});
