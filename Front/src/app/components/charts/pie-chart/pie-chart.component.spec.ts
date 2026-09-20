import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { PieChartComponent } from './pie-chart.component';

import { SentimentIdeologyService } from '../../../services/sentiment-ideology.service';

const mockTranslateService = {
  instant: jest.fn((key: string) => key),
  get: jest.fn((key: string) => of(key)),
  onLangChange: new Subject(),
  onTranslationChange: new Subject(),
  onDefaultLangChange: new Subject(),
};

const mockSentimentIdeologyService = {
  sentiments$: new Subject(),
  ideologies$: new Subject(),
  getItemColor: jest.fn(() => '#4caf50'),
  getCategoryColor: jest.fn(() => '#4caf50'),
  ensureLoaded: jest.fn().mockResolvedValue(undefined),
};

describe('PieChartComponent', () => {
  let component: PieChartComponent;
  let fixture: ComponentFixture<PieChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PieChartComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: SentimentIdeologyService, useValue: mockSentimentIdeologyService },
      ],
    })
    .overrideComponent(PieChartComponent, { set: { imports: [], template: '<div></div>' } })
    .compileComponents();

    fixture = TestBed.createComponent(PieChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
