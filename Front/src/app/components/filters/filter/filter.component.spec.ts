import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FILTERS, MEDIAS } from '../../../utils/constants';
import { FilterComponent } from './filter.component';
import { FiltersService } from '../../../services/filters.service';
import { GeneralService } from '../../../services/general.service';
import { MediaCompose } from '../../../models/media.model';
import { MinMaxDateRead } from '../../../models/items.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { filtersTypeDialog$ } from '../../../utils/dialog-subjects';

class MockFiltersService {
  medias$ = of([]);
  mediaCompose$ = of(new MediaCompose());
}

class MockGeneralService {
  isMobile$ = new BehaviorSubject<boolean>(false);
  minMaxDate$ = new BehaviorSubject<MinMaxDateRead>(new MinMaxDateRead('2024-01-01', '2024-12-31'));
}

describe('FilterComponent', () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent],
      providers: [
        { provide: FiltersService, useClass: MockFiltersService },
        { provide: GeneralService, useClass: MockGeneralService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FilterComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 4 media compose filter items', () => {
    expect(component.mediaCompose).toHaveLength(4);
  });

  it('should include MEDIAS, TYPES, COUNTRIES and REGIONS in mediaCompose', () => {
    const types = component.mediaCompose.map((i) => i.type);
    expect(types).toContain(MEDIAS);
    expect(types).toContain(FILTERS.TYPES);
    expect(types).toContain(FILTERS.COUNTRIES);
    expect(types).toContain(FILTERS.REGIONS);
  });

  it('sendFiltersDialog should emit the type to filtersTypeDialog$', () => {
    const spy = jest.spyOn(filtersTypeDialog$, 'next');
    component.sendFiltersDialog(FILTERS.TYPES);
    expect(spy).toHaveBeenCalledWith(FILTERS.TYPES);
  });

  it('onSelectCompose for MEDIAS should disable other filter items when a media is selected', () => {
    const mediasItem = component.mediaCompose.find((i) => i.type === MEDIAS)!;
    mediasItem.value.set({ key: 1, label: 'Test Media' });
    component.onSelectCompose(mediasItem);

    const typesItem = component.mediaCompose.find((i) => i.type === FILTERS.TYPES)!;
    expect(typesItem.disabled()).toBe(true);
  });

  it('onSelectCompose for MEDIAS should clear other filter values when a media is selected', () => {
    const typesItem = component.mediaCompose.find((i) => i.type === FILTERS.TYPES)!;
    typesItem.value.set({ key: 'MEDIA', label: 'Media' });

    const mediasItem = component.mediaCompose.find((i) => i.type === MEDIAS)!;
    mediasItem.value.set({ key: 1, label: 'Test Media' });
    component.onSelectCompose(mediasItem);

    expect(typesItem.value()).toBeNull();
  });

  it('onSelectCompose for MEDIAS with null value should re-enable other filters', () => {
    const mediasItem = component.mediaCompose.find((i) => i.type === MEDIAS)!;
    mediasItem.value.set(null);
    component.onSelectCompose(mediasItem);

    const typesItem = component.mediaCompose.find((i) => i.type === FILTERS.TYPES)!;
    expect(typesItem.disabled()).toBe(false);
  });

  it('onSelectCompose for TYPES should disable MEDIAS item', () => {
    const typesItem = component.mediaCompose.find((i) => i.type === FILTERS.TYPES)!;
    typesItem.value.set({ key: 'MEDIA', label: 'Media' });
    component.onSelectCompose(typesItem);

    const mediasItem = component.mediaCompose.find((i) => i.type === MEDIAS)!;
    expect(mediasItem.disabled()).toBe(true);
  });
});
