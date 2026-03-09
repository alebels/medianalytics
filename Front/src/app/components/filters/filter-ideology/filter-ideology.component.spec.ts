import { BehaviorSubject, Subject } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterChartsRead } from '../../../models/items.model';
import { FilterIdeologyComponent } from './filter-ideology.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SentimentIdeologyService } from '../../../services/sentiment-ideology.service';
import { ToastService } from '../../../services/toast.service';
import { TranslateService } from '@ngx-translate/core';

class MockSentimentIdeologyService {
  ideologies$ = new BehaviorSubject({ ideologies: [] });
  setFilterIdeology = jest.fn().mockResolvedValue(new FilterChartsRead());
}

class MockToastService {
  showWarn = jest.fn();
}

class MockTranslateService {
  onLangChange = new Subject<{ lang: string }>();
}

describe('FilterIdeologyComponent', () => {
  let component: FilterIdeologyComponent;
  let fixture: ComponentFixture<FilterIdeologyComponent>;
  let mockSentimentService: MockSentimentIdeologyService;
  let mockToastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterIdeologyComponent],
      providers: [
        { provide: SentimentIdeologyService, useClass: MockSentimentIdeologyService },
        { provide: ToastService, useClass: MockToastService },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FilterIdeologyComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    mockSentimentService = TestBed.inject(SentimentIdeologyService) as unknown as MockSentimentIdeologyService;
    mockToastService = TestBed.inject(ToastService) as unknown as MockToastService;

    fixture = TestBed.createComponent(FilterIdeologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onClickFilter should show empty_filters when no composeValues provided', () => {
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('empty_filters');
  });

  it('onClickFilter should show empty_filters when only date type is present', () => {
    component.getComposeValues([{ type: 'date', key: ['2024-01-01'] }]);
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('empty_filters');
  });

  it('onClickFilter should call setFilterIdeology with valid filters', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.onClickFilter();
    expect(mockSentimentService.setFilterIdeology).toHaveBeenCalled();
  });

  it('onClickFilter should show no_changes on repeated identical filter', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.onClickFilter();
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('no_changes');
  });

  it('language change should reset all charts and lastFilter', () => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;
    component.barChart = { xLabels: [], series: [], type: 'bar', translate: 'none' };
    component.pieChart = { xLabels: [], series: [], type: 'donut', translate: 'none' };

    trans.onLangChange.next({ lang: 'es' });

    expect(component.barChart).toBeNull();
    expect(component.pieChart).toBeNull();
    expect(component.lineChart).toBeNull();
  });
});
