import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FilterChartsRead } from '../models/items.model';
import { SentimentIdeologyService } from './sentiment-ideology.service';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

class MockTranslateService {
  instant = jest.fn((key: string) => key);
}

const mockSentimentsIdeologies = {
  sentiments: [
    { category: 'POSITIVES', values: ['positive', 'happy'] },
    { category: 'NEGATIVES', values: ['negative', 'sad'] },
    { category: 'NEUTRALS', values: ['neutral'] },
  ],
  ideologies: [
    { category: 'POLITICAL_SPECTRUM', values: ['left', 'right'] },
    { category: 'ECONOMIC_ORIENTATIONS', values: ['capitalist'] },
  ],
};

describe('SentimentIdeologyService', () => {
  let service: SentimentIdeologyService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SentimentIdeologyService,
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    });

    service = TestBed.inject(SentimentIdeologyService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/sentimentsideologies`);
    req.flush(mockSentimentsIdeologies);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit sentiments$ after initialization', (done) => {
    service.sentiments$.subscribe((data) => {
      expect(data).toBeDefined();
      expect(data.sentiments).toBeDefined();
      done();
    });
  });

  it('should emit ideologies$ after initialization', (done) => {
    service.ideologies$.subscribe((data) => {
      expect(data).toBeDefined();
      expect(data.ideologies).toBeDefined();
      done();
    });
  });

  it('sentiments$ should have items populated from API data', (done) => {
    service.sentiments$.subscribe((data) => {
      const positivesGroup = data.sentiments.find((g) => g.label === 'POSITIVES');
      expect(positivesGroup).toBeDefined();
      expect(positivesGroup!.items.length).toBe(2);
      done();
    });
  });

  it('ideologies$ should have items populated from API data', (done) => {
    service.ideologies$.subscribe((data) => {
      const politicalGroup = data.ideologies.find((g) => g.label === 'POLITICAL_SPECTRUM');
      expect(politicalGroup).toBeDefined();
      expect(politicalGroup!.items.length).toBe(2);
      done();
    });
  });

  it('setFilterSentiment should POST to sentimentsfilter and return result', async () => {
    const mockResult = new FilterChartsRead([{ name: 'positive', count: 10 }], null, null);
    const filter = { type: 'MEDIA' };

    const promise = service.setFilterSentiment(filter);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/sentimentsfilter`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filter);
    req.flush(mockResult);

    const result = await promise;
    expect(result.plain).toEqual(mockResult.plain);
  });

  it('setFilterIdeology should POST to ideologiesfilter and return result', async () => {
    const mockResult = new FilterChartsRead([{ name: 'left', count: 5 }], null, null);
    const filter = { country: 'US' };

    const promise = service.setFilterIdeology(filter);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/ideologiesfilter`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filter);
    req.flush(mockResult);

    const result = await promise;
    expect(result.plain).toEqual(mockResult.plain);
  });

  it('getTranslatedSentimentsIdeologies should publish sorted translated sentiments', (done) => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;
    trans.instant.mockImplementation((key: string) => `t:${key}`);

    service.getTranslatedSentimentsIdeologies();

    service.sentiments$.subscribe((data) => {
      expect(data.sentiments.length).toBeGreaterThan(0);
      expect(trans.instant).toHaveBeenCalled();
      done();
    });
  });

  it('getTranslatedSentimentsIdeologies should sort items alphabetically within each group', (done) => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;
    trans.instant.mockImplementation((key: string) => key);

    service.getTranslatedSentimentsIdeologies();

    service.sentiments$.subscribe((data) => {
      const posGroup = data.sentiments.find((g) => g.label === 'POSITIVES');
      if (posGroup && posGroup.items.length > 1) {
        const labels = posGroup.items.map((i) => i.label);
        const sorted = [...labels].sort((a, b) => a.localeCompare(b));
        expect(labels).toEqual(sorted);
      }
      done();
    });
  });
});
