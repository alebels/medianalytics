import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataCountTable } from '../../../models/table.model';
import { ItemRead } from '../../../models/items.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SortTableComponent } from './sort-table.component';

const mockData: ItemRead[] = [
  { name: 'Word1', count: 100 },
  { name: 'Word2', count: 50 },
];

describe('SortTableComponent', () => {
  let component: SortTableComponent;
  let fixture: ComponentFixture<SortTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortTableComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SortTableComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(SortTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize labels and sortOrder from input on ngOnInit', () => {
    const table = new DataCountTable(mockData, 'Word', 'Count', -1);
    fixture.componentRef.setInput('dataSortTable', table);
    component.ngOnInit();

    expect(component.label1).toBe('Word');
    expect(component.label2).toBe('Count');
    expect(component.sortOrder).toBe(-1);
  });

  it('should copy data from input to dataTable', () => {
    const table = new DataCountTable(mockData, 'W', 'C', 1);
    fixture.componentRef.setInput('dataSortTable', table);
    component.ngOnInit();

    expect(component.dataTable).toEqual(mockData);
    expect(component.dataTable).not.toBe(mockData);
  });

  it('should default to empty values when input is undefined', () => {
    fixture.componentRef.setInput('dataSortTable', undefined);
    component.ngOnInit();

    expect(component.dataTable).toEqual([]);
    expect(component.label1).toBe('');
    expect(component.label2).toBe('');
    expect(component.sortOrder).toBe(1);
  });

  it('should use sortOrder from input when provided', () => {
    const table = new DataCountTable([], 'A', 'B', -1);
    fixture.componentRef.setInput('dataSortTable', table);
    component.ngOnInit();

    expect(component.sortOrder).toBe(-1);
  });
});
