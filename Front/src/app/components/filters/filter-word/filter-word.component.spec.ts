import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterWordComponent } from './filter-word.component';
import { FiltersService } from '../../../services/filters.service';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastService } from '../../../services/toast.service';
import { TranslateService } from '@ngx-translate/core';

class MockFiltersService {
  setFilterWord = jest.fn().mockResolvedValue([]);
}

class MockToastService {
  showWarn = jest.fn();
}

class MockTranslateService {
  onLangChange = new Subject<{ lang: string }>();
  instant = jest.fn((key: string) => key);
}

describe('FilterWordComponent', () => {
  let component: FilterWordComponent;
  let fixture: ComponentFixture<FilterWordComponent>;
  let mockFiltersService: MockFiltersService;
  let mockToastService: MockToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterWordComponent],
      providers: [
        { provide: FiltersService, useClass: MockFiltersService },
        { provide: ToastService, useClass: MockToastService },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FilterWordComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    mockFiltersService = TestBed.inject(FiltersService) as unknown as MockFiltersService;
    mockToastService = TestBed.inject(ToastService) as unknown as MockToastService;

    fixture = TestBed.createComponent(FilterWordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('onClickFilter should show empty_filters warn when composeValues is empty', () => {
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('empty_filters');
  });

  it('onClickFilter should show empty_filters warn when only DATE type is present', () => {
    component.getComposeValues([{ type: 'date', key: ['2024-01-01', '2024-01-31'] }]);
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('empty_filters');
  });

  it('onClickFilter should show min_max_range warn when minRange >= maxRange', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.minRange = 100;
    component.maxRange = 50;
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('min_max_range');
  });

  it('onClickFilter should show range_too_large when range diff exceeds 400', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.minRange = 1;
    component.maxRange = 402;
    component.onClickFilter();
    expect(mockToastService.showWarn).toHaveBeenCalledWith('range_too_large');
  });

  it('onClickFilter should call setFilterWord with valid filter params', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.minRange = null;
    component.maxRange = 200;
    component.onClickFilter();
    expect(mockFiltersService.setFilterWord).toHaveBeenCalled();
  });

  it('onClickFilter should show no_changes when same filter is submitted twice', () => {
    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.minRange = null;
    component.maxRange = 200;

    component.onClickFilter();
    component.onClickFilter();

    expect(mockToastService.showWarn).toHaveBeenCalledWith('no_changes');
  });

  it('language change should reset dataWordsTable and lastFilter', () => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;

    component.getComposeValues([{ type: 'medias', key: '1' }]);
    component.minRange = null;
    component.maxRange = 200;
    component.onClickFilter();

    trans.onLangChange.next({ lang: 'es' });

    expect(component.dataWordsTable).toBeNull();
  });
});
