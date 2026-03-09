import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GeneralMediaRead, GeneralMediaTable } from '../../../models/table.model';
import { BehaviorSubject } from 'rxjs';
import { GeneralService } from '../../../services/general.service';
import { GeneralTableComponent } from './general-table.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

const mockGeneralSrv = {
  isMobile$: new BehaviorSubject<boolean>(false),
};

const mockMedia1 = new GeneralMediaRead('Media Alpha', 'Alpha Full', 'MEDIA', 'US', 'NA', 'a.com');
const mockMedia2 = new GeneralMediaRead('Media Beta', 'Beta Full', 'ORG', 'UK', 'EU', 'b.com');

describe('GeneralTableComponent', () => {
  let component: GeneralTableComponent;
  let fixture: ComponentFixture<GeneralTableComponent>;

  beforeEach(async () => {
    mockGeneralSrv.isMobile$.next(false);

    await TestBed.configureTestingModule({
      imports: [GeneralTableComponent],
      providers: [{ provide: GeneralService, useValue: mockGeneralSrv }],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(GeneralTableComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(GeneralTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize labels from input on ngOnInit', () => {
    const table = new GeneralMediaTable(
      [mockMedia1, mockMedia2],
      'Name', 'Type', 'Country', 'Region', 'URL',
      'Total', 'Avg Words', 'Top Words', 'Top Sent', 'Bot Sent', 'Top Ideo', 'Bot Ideo', 'Grammar'
    );
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    expect(component.labelName).toBe('Name');
    expect(component.labelType).toBe('Type');
    expect(component.labelCountry).toBe('Country');
    expect(component.labelRegion).toBe('Region');
    expect(component.dataTable).toHaveLength(2);
  });

  it('should set isMobile from GeneralService on init', () => {
    mockGeneralSrv.isMobile$.next(true);
    component.ngOnInit();
    expect(component.isMobile).toBe(true);
    mockGeneralSrv.isMobile$.next(false);
  });

  it('should initialize with empty dataTableLocked', () => {
    component.ngOnInit();
    expect(component.dataTableLocked).toEqual([]);
  });

  it('toggleLock with frozen=true should add item to dataTableLocked', () => {
    const table = new GeneralMediaTable([mockMedia1, mockMedia2]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.toggleLock(mockMedia1, true);

    expect(component.dataTableLocked).toContain(mockMedia1);
    expect(component.dataTable).not.toContain(mockMedia1);
  });

  it('toggleLock with frozen=false should remove item from dataTableLocked', () => {
    const table = new GeneralMediaTable([mockMedia1, mockMedia2]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.toggleLock(mockMedia1, true);
    component.toggleLock(mockMedia1, false);

    expect(component.dataTableLocked).not.toContain(mockMedia1);
    expect(component.dataTable).toContain(mockMedia1);
  });

  it('toggleLock should not add more than 3 items to locked list', () => {
    const m3 = new GeneralMediaRead('C', '', 'MEDIA', 'FR', 'EU', 'c.com');
    const m4 = new GeneralMediaRead('D', '', 'MEDIA', 'DE', 'EU', 'd.com');
    const table = new GeneralMediaTable([mockMedia1, mockMedia2, m3, m4]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.toggleLock(mockMedia1, true);
    component.toggleLock(mockMedia2, true);
    component.toggleLock(m3, true);
    component.toggleLock(m4, true);

    expect(component.dataTableLocked).toHaveLength(3);
  });

  it('filterGlobal should filter dataTable by name (case-insensitive)', () => {
    const table = new GeneralMediaTable([mockMedia1, mockMedia2]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.filterGlobal('alpha');

    expect(component.dataTable).toHaveLength(1);
    expect(component.dataTable[0].name).toBe('Media Alpha');
  });

  it('filterGlobal with empty string should show all unlocked items', () => {
    const table = new GeneralMediaTable([mockMedia1, mockMedia2]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.filterGlobal('Alpha');
    component.filterGlobal('');

    expect(component.dataTable).toHaveLength(2);
  });

  it('filterGlobal should not include locked items in results', () => {
    const table = new GeneralMediaTable([mockMedia1, mockMedia2]);
    fixture.componentRef.setInput('dataGeneralTable', table);
    component.ngOnInit();

    component.toggleLock(mockMedia1, true);
    component.filterGlobal('');

    expect(component.dataTable).not.toContain(mockMedia1);
    expect(component.dataTable).toContain(mockMedia2);
  });
});
