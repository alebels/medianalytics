import { COUNT, GRAMMAR, IDEOLOGIES, SENTIMENTS, WORD } from '../utils/constants';
import { CompoundDataCharts, DataChart } from '../models/chart.model';
import { DataCountTable, GeneralMediaTable } from '../models/table.model';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GeneralService } from './general.service';
import { HomeService } from './home.service';
import { MinMaxDateRead } from '../models/items.model';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';

describe('HomeService', () => {
  let service: HomeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HomeService, GeneralService],
    });
    service = TestBed.inject(HomeService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle the initial HTTP request from GeneralService
    const minMaxReq = httpMock.expectOne(`${environment.apiUrl}/filters/minmaxdate`);
    minMaxReq.flush(new MinMaxDateRead());

    // Handle all the initial HTTP requests from HomeService
    const requests = [
      { url: `${environment.apiUrl}/home/generaltotalmedias`, response: 5 },
      { url: `${environment.apiUrl}/home/generaltotalarticles`, response: 100 },
      { url: `${environment.apiUrl}/home/generalaveragewordcount`, response: 250 },
      { url: `${environment.apiUrl}/home/generaltotalwords`, response: 50000 },
      { url: `${environment.apiUrl}/home/generaldaytopwords`, response: [{ name: 'test', count: 10 }] },
      { url: `${environment.apiUrl}/home/generaldaysentiments`, response: { plain: [{ name: 'positive', count: 15 }], categorized: [{ name: 'positive', count: 15 }] } },
      { url: `${environment.apiUrl}/home/generaldayideologies`, response: { plain: [{ name: 'liberal', count: 20 }], categorized: [{ name: 'liberal', count: 20 }] } },
      { url: `${environment.apiUrl}/home/generaltable`, response: [{ name: 'Test Media', type: 'newspaper', country: 'US', region: 'North America', url: 'test.com', total_articles: 50, average_words_article: 300, top_words: [], top_sentiments: [], bottom_sentiments: [], top_ideologies: [], bottom_ideologies: [] }] },
      { url: `${environment.apiUrl}/home/generaltopwords`, response: [{ name: 'news', count: 25 }] },
      { url: `${environment.apiUrl}/home/generalbottomwords`, response: [{ name: 'rare', count: 1 }] },
      { url: `${environment.apiUrl}/home/generalsentiments`, response: { plain: [{ name: 'neutral', count: 30 }], categorized: [{ name: 'neutral', count: 30 }] } },
      { url: `${environment.apiUrl}/home/generalideologies`, response: { plain: [{ name: 'moderate', count: 35 }], categorized: [{ name: 'moderate', count: 35 }] } },
      { url: `${environment.apiUrl}/home/generaltopgrammar`, response: [{ name: 'noun', count: 40 }] }
    ];

    requests.forEach(req => {
      const httpReq = httpMock.expectOne(req.url);
      httpReq.flush(req.response);
    });
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize all observables with correct data', () => {
    service.generalTotalMedias$.subscribe(value => {
      expect(value).toBe(5);
    });

    service.generalTotalArticles$.subscribe(value => {
      expect(value).toBe(100);
    });

    service.generalTotalWords$.subscribe(value => {
      expect(value).toBe(50000);
    });

    service.generalAverageWord$.subscribe(value => {
      expect(value).toBe(250);
    });
  });

  it('should transform top words data correctly', () => {
    service.generalTopWords$.subscribe(data => {
      expect(data).toBeInstanceOf(DataChart);
      expect(data.xLabels).toEqual(['news']);
      expect(data.series).toEqual([{ name: COUNT, data: [25] }]);
      expect(data.type).toBe('bar');
    });
  });

  it('should transform day top words data correctly', () => {
    service.generalDayTopWords$.subscribe(data => {
      expect(data).toBeInstanceOf(DataChart);
      expect(data.xLabels).toEqual(['test']);
      expect(data.series).toEqual([{ name: COUNT, data: [10] }]);
      expect(data.type).toBe('bar');
    });
  });

  it('should transform bottom words data correctly', () => {
    service.generalBottomWords$.subscribe(data => {
      expect(data).toBeInstanceOf(DataCountTable);
      expect(data.data).toEqual([{ name: 'rare', count: 1 }]);
      expect(data.label1).toBe(WORD);
      expect(data.label2).toBe(COUNT);
    });
  });

  it('should transform sentiments data correctly with translations', () => {
    service.generalSentiments$.subscribe(data => {
      expect(data).toBeInstanceOf(CompoundDataCharts);
      expect(data.plain.translate).toBe(SENTIMENTS);
      expect(data.categorized.translate).toBe(SENTIMENTS);
      expect(data.plain.type).toBe('bar');
      expect(data.categorized.type).toBe('donut');
    });
  });

  it('should transform day sentiments data correctly with translations', () => {
    service.generalDaySentiments$.subscribe(data => {
      expect(data).toBeInstanceOf(CompoundDataCharts);
      expect(data.plain.translate).toBe(SENTIMENTS);
      expect(data.categorized.translate).toBe(SENTIMENTS);
    });
  });

  it('should transform ideologies data correctly with translations', () => {
    service.generalIdeologies$.subscribe(data => {
      expect(data).toBeInstanceOf(CompoundDataCharts);
      expect(data.plain.translate).toBe(IDEOLOGIES);
      expect(data.categorized.translate).toBe(IDEOLOGIES);
      expect(data.plain.type).toBe('bar');
      expect(data.categorized.type).toBe('donut');
    });
  });

  it('should transform day ideologies data correctly with translations', () => {
    service.generalDayIdeologies$.subscribe(data => {
      expect(data).toBeInstanceOf(CompoundDataCharts);
      expect(data.plain.translate).toBe(IDEOLOGIES);
      expect(data.categorized.translate).toBe(IDEOLOGIES);
    });
  });

  it('should transform top grammar data correctly', () => {
    service.generalTopGrammar$.subscribe(data => {
      expect(data).toBeInstanceOf(DataChart);
      expect(data.translate).toBe(GRAMMAR);
      expect(data.type).toBe('donut');
      expect(data.xLabels).toEqual(['noun']);
      expect(data.series).toEqual([40]);
    });
  });

  it('should transform table data correctly', () => {
    service.generalTableSub$.subscribe(data => {
      expect(data).toBeInstanceOf(GeneralMediaTable);
      expect(data.data.length).toBe(1);
      expect(data.data[0].name).toBe('Test Media');
      expect(data.labelName).toBe('name');
      expect(data.labelType).toBe('type');
      expect(data.labelCountry).toBe('country');
      expect(data.labelRegion).toBe('region');
      expect(data.labelUrl).toBe('url');
    });
  });

  it('should handle API endpoints correctly', () => {
    expect(service).toBeTruthy();
    
    // Verify that all observables have been initialized
    let totalMediasValue: number;
    let totalArticlesValue: number;
    let totalWordsValue: number;
    let averageWordValue: number;

    service.generalTotalMedias$.subscribe(value => totalMediasValue = value);
    service.generalTotalArticles$.subscribe(value => totalArticlesValue = value);
    service.generalTotalWords$.subscribe(value => totalWordsValue = value);
    service.generalAverageWord$.subscribe(value => averageWordValue = value);

    expect(totalMediasValue!).toBeGreaterThanOrEqual(0);
    expect(totalArticlesValue!).toBeGreaterThanOrEqual(0);
    expect(totalWordsValue!).toBeGreaterThanOrEqual(0);
    expect(averageWordValue!).toBeGreaterThanOrEqual(0);
  });
});