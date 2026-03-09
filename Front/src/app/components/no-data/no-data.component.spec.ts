import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { NO_DATA } from '../../utils/constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NoData } from '../../models/items.model';
import { NoDataComponent } from './no-data.component';

describe('NoDataComponent', () => {
  let component: NoDataComponent;
  let fixture: ComponentFixture<NoDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoDataComponent],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(NoDataComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NoDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have loadingHomeText set to the LOADING_HOME constant', () => {
    expect(component.loadingHomeText).toBe(NO_DATA.LOADING_HOME);
  });

  it('should set type from noData input on ngOnInit', () => {
    const noData: NoData = { type: 'custom_type' };
    fixture.componentRef.setInput('noData', noData);
    component.ngOnInit();
    expect(component.type).toBe('custom_type');
  });

  it('should default to NO_DATA type when noData input is undefined', () => {
    fixture.componentRef.setInput('noData', undefined);
    component.ngOnInit();
    expect(component.type).toBe(NO_DATA.NO_DATA);
  });

  it('should update isLoading when noData.isLoading$ emits true', () => {
    const isLoading$ = new BehaviorSubject<boolean>(false);
    const noData: NoData = { type: 'test', isLoading: isLoading$ };
    fixture.componentRef.setInput('noData', noData);
    component.ngOnInit();

    isLoading$.next(true);
    expect(component.isLoading).toBe(true);
  });

  it('should update isLoading when noData.isLoading$ emits false', () => {
    const isLoading$ = new BehaviorSubject<boolean>(true);
    const noData: NoData = { type: 'test', isLoading: isLoading$ };
    fixture.componentRef.setInput('noData', noData);
    component.ngOnInit();

    expect(component.isLoading).toBe(true);
    isLoading$.next(false);
    expect(component.isLoading).toBe(false);
  });

  it('should start with isLoading false', () => {
    expect(component.isLoading).toBe(false);
  });
});
