import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { DataChart } from '../../../models/chart.model';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { BarChartComponent } from './bar-chart.component';

const mockTranslateService = {
  instant: jest.fn((key: string) => key),
  get: jest.fn((key: string) => of(key)),
  onLangChange: new Subject(),
  onTranslationChange: new Subject(),
  onDefaultLangChange: new Subject(),
};

describe('BarChartComponent', () => {
  let component: BarChartComponent;
  let fixture: ComponentFixture<BarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarChartComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: TranslateService, useValue: mockTranslateService }],
    })
    .overrideComponent(BarChartComponent, { set: { imports: [], template: '<div></div>' } })
    .compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('dataBarChart', new DataChart(['A'], [{ name: 'L', data: [1] }]));
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
