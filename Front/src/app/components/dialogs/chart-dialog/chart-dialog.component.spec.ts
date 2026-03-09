import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChartDialog } from '../../../models/dialog.model';
import { ChartDialogComponent } from './chart-dialog.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NONE } from '../../../utils/constants';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { isShowChartDialog$ } from '../../../utils/dialog-subjects';
import { signal } from '@angular/core';

describe('ChartDialogComponent', () => {
  let component: ChartDialogComponent;
  let fixture: ComponentFixture<ChartDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartDialogComponent, HttpClientTestingModule],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ChartDialogComponent, {
        set: { imports: [], template: '<div></div>' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChartDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('count computed should return 0 when no input is provided', () => {
    expect(component.count()).toBe(0);
  });

  it('count computed should return count from ChartDialog input', () => {
    const dialog = new ChartDialog();
    dialog.count.set(42);
    fixture.componentRef.setInput('dataChartDialog', dialog);
    fixture.detectChanges();
    expect(component.count()).toBe(42);
  });

  it('title computed should return empty string when no input is provided', () => {
    expect(component.title()).toBe('');
  });

  it('title computed should return value when no valuation is set', () => {
    const dialog = new ChartDialog(signal('word'), signal(5));
    fixture.componentRef.setInput('dataChartDialog', dialog);
    fixture.detectChanges();
    expect(component.title()).toBe('word');
  });

  it('title computed should combine valuation.value when valuation is set and not NONE', () => {
    const dialog = new ChartDialog(signal('positive'), signal(10));
    dialog.valuation = 'sentiments';
    fixture.componentRef.setInput('dataChartDialog', dialog);
    fixture.detectChanges();
    expect(component.title()).toBe('sentiments.positive');
  });

  it('title computed should return just value when valuation is NONE', () => {
    const dialog = new ChartDialog(signal('word'), signal(5));
    dialog.valuation = NONE;
    fixture.componentRef.setInput('dataChartDialog', dialog);
    fixture.detectChanges();
    expect(component.title()).toBe('word');
  });

  it('title computed should return empty string when value is empty', () => {
    const dialog = new ChartDialog(signal(''), signal(0));
    fixture.componentRef.setInput('dataChartDialog', dialog);
    fixture.detectChanges();
    expect(component.title()).toBe('');
  });

  it('onClose should emit false to isShowChartDialog$', () => {
    const spy = jest.spyOn(isShowChartDialog$, 'next');
    component.onClose();
    expect(spy).toHaveBeenCalledWith(false);
  });
});
