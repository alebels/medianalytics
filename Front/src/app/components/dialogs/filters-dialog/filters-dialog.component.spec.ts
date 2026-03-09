import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FILTERS, IDEOLOGIES, MEDIAS, SENTIMENTS } from '../../../utils/constants';
import { SelectGroupItem2, SelectItem2 } from '../../../models/primeng.model';
import { BehaviorSubject } from 'rxjs';
import { FilterDialog } from '../../../models/dialog.model';
import { FiltersDialogComponent } from './filters-dialog.component';
import { GeneralService } from '../../../services/general.service';
import { MediaRead } from '../../../models/media.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

class MockGeneralService {
  isMobile$ = new BehaviorSubject<boolean>(false);
}

class MockTranslateService {
  instant = jest.fn((key: string) => key);
}

describe('FiltersDialogComponent', () => {
  let component: FiltersDialogComponent;
  let fixture: ComponentFixture<FiltersDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiltersDialogComponent],
      providers: [
        { provide: GeneralService, useClass: MockGeneralService },
        { provide: TranslateService, useClass: MockTranslateService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(FiltersDialogComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(FiltersDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('header computed should return empty string when no input provided', () => {
    expect(component.header()).toBe('');
  });

  it('header computed should return the header value from FilterDialog input', () => {
    const dialog = new FilterDialog([], [], undefined, undefined, FILTERS.TYPES);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.header()).toBe(FILTERS.TYPES);
  });

  it('count computed should return 0 when no input', () => {
    expect(component.count()).toBe(0);
  });

  it('count computed should return unique type count when header is TYPES', () => {
    const medias: MediaRead[] = [
      { id: 1, name: 'A', type: 'MEDIA', country: 'US', region: 'NA' },
      { id: 2, name: 'B', type: 'MEDIA', country: 'UK', region: 'EU' },
      { id: 3, name: 'C', type: 'ORG', country: 'FR', region: 'EU' },
    ];
    const dialog = new FilterDialog([], [], undefined, medias, FILTERS.TYPES);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(2);
  });

  it('count computed should return unique country count when header is COUNTRIES', () => {
    const medias: MediaRead[] = [
      { id: 1, name: 'A', type: 'MEDIA', country: 'US', region: 'NA' },
      { id: 2, name: 'B', type: 'MEDIA', country: 'US', region: 'NA' },
      { id: 3, name: 'C', type: 'ORG', country: 'UK', region: 'EU' },
    ];
    const dialog = new FilterDialog([], [], undefined, medias, FILTERS.COUNTRIES);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(2);
  });

  it('count computed should sum sentiment items when header is SENTIMENTS', () => {
    const group = new SelectGroupItem2('POSITIVES', 'smile');
    group.items = [
      new SelectItem2('positive'),
      new SelectItem2('happy'),
    ];
    const dialog = new FilterDialog([group], [], undefined, undefined, SENTIMENTS);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(2);
  });

  it('count computed should sum ideology items when header is IDEOLOGIES', () => {
    const group = new SelectGroupItem2('POLITICAL_SPECTRUM', 'book');
    group.items = [new SelectItem2('left'), new SelectItem2('right'), new SelectItem2('center')];
    const dialog = new FilterDialog([], [group], undefined, undefined, IDEOLOGIES);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(3);
  });

  it('count computed should return generalMedias length when header is MEDIAS', () => {
    const generalMedias = [
      { name: 'Media A', type: 'MEDIA', country: 'US', url: 'a.com' },
      { name: 'Media B', type: 'ORG', country: 'UK', url: 'b.com' },
    ];
    const dialog = new FilterDialog([], [], generalMedias, undefined, MEDIAS);
    fixture.componentRef.setInput('dataFiltersDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(2);
  });
});
