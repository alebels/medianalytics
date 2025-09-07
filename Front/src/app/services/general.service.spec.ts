import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ItemRead, ItemSerie, MinMaxDateRead } from '../models/items.model';
import { DataChart } from '../models/chart.model';
import { GeneralService } from './general.service';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';

describe('GeneralService', () => {
  let service: GeneralService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GeneralService],
    });
    service = TestBed.inject(GeneralService);
    httpMock = TestBed.inject(HttpTestingController);

    // Handle the initial HTTP request made during service creation
    const req = httpMock.expectOne(`${environment.apiUrl}/filters/minmaxdate`);
    req.flush(new MinMaxDateRead());
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize and fetch min/max dates on creation', () => {
    service.minMaxDate$.subscribe((data) => {
      expect(data).toBeInstanceOf(MinMaxDateRead);
    });
  });

  it('should detect mobile devices', () => {
    const originalUserAgent = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      configurable: true,
    });

    const httpClient = TestBed.inject(HttpClient);
    const mobileService = new GeneralService(httpClient);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/minmaxdate`);
    req.flush(new MinMaxDateRead());

    mobileService.isMobile$.subscribe((isMobile) => {
      expect(isMobile).toBe(true);
    });

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should detect desktop devices', () => {
    const originalUserAgent = navigator.userAgent;

    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });

    const httpClient = TestBed.inject(HttpClient);
    const desktopService = new GeneralService(httpClient);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/minmaxdate`);
    req.flush(new MinMaxDateRead());

    desktopService.isMobile$.subscribe((isMobile) => {
      expect(isMobile).toBe(false);
    });

    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    });
  });

  it('should convert data to bar chart format', () => {
    const mockData: ItemRead[] = [
      { name: 'Category 1', count: 10 },
      { name: 'Category 2', count: 15 },
      { name: 'Category 3', count: 8 },
    ];
    const label = 'Test Label';

    const result = service.setToBarChart(mockData, label);

    expect(result).toBeInstanceOf(DataChart);
    expect(result.xLabels).toEqual(['Category 1', 'Category 2', 'Category 3']);
    expect(result.series).toEqual([
      {
        name: 'Test Label',
        data: [10, 15, 8],
      },
    ]);
    expect(result.type).toBe('bar');
  });

  it('should convert data to line chart format', () => {
    const mockData: ItemSerie[] = [
      { name: 'Series 1', data: [1, 2, 3] },
      { name: 'Series 2', data: [4, 5, 6] },
    ];
    const labels = ['Jan', 'Feb', 'Mar'];

    const result = service.setToLineChart(mockData, labels);

    expect(result).toBeInstanceOf(DataChart);
    expect(result.xLabels).toEqual(['Jan', 'Feb', 'Mar']);
    expect(result.series).toEqual(mockData);
    expect(result.type).toBe('line');
  });

  it('should convert data to pie chart format', () => {
    const mockData: ItemRead[] = [
      { name: 'Slice 1', count: 30 },
      { name: 'Slice 2', count: 45 },
      { name: 'Slice 3', count: 25 },
    ];

    const result = service.setToPieChart(mockData);

    expect(result).toBeInstanceOf(DataChart);
    expect(result.xLabels).toEqual(['Slice 1', 'Slice 2', 'Slice 3']);
    expect(result.series).toEqual([30, 45, 25]);
    expect(result.type).toBe('donut');
  });

  it('should handle empty data arrays in chart conversion methods', () => {
    const emptyData: ItemRead[] = [];

    const barChart = service.setToBarChart(emptyData, 'Empty');
    expect(barChart.xLabels).toEqual([]);
    expect(barChart.series).toEqual([{ name: 'Empty', data: [] }]);

    const pieChart = service.setToPieChart(emptyData);
    expect(pieChart.xLabels).toEqual([]);
    expect(pieChart.series).toEqual([]);
  });

});
