import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FiltersService } from './filters.service';
import { MediaRead } from '../models/media.model';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

class MockTranslateService {
  instant = jest.fn((key: string) => key);
}

const mockMedias: MediaRead[] = [
  { id: 1, name: 'Media Alpha', type: 'MEDIA', country: 'US', region: 'NORTH_AMERICA' },
  { id: 2, name: 'Media Beta', type: 'ORGANIZATION', country: 'UK', region: 'EUROPE' },
  { id: 3, name: 'Media Gamma', type: 'MEDIA', country: 'US', region: 'NORTH_AMERICA' },
];

describe('FiltersService', () => {
  let service: FiltersService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FiltersService,
        { provide: TranslateService, useClass: MockTranslateService },
      ],
    });

    service = TestBed.inject(FiltersService);
    httpMock = TestBed.inject(HttpTestingController);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/medias`);
    req.flush(mockMedias);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit mediaRead$ with fetched medias', (done) => {
    service.mediaRead$.subscribe((data) => {
      expect(data).toEqual(mockMedias);
      done();
    });
  });

  it('should build mediaCompose with unique countries from medias', (done) => {
    service.mediaCompose$.subscribe((data) => {
      const countryKeys = data.countries.map((c) => c.key);
      expect(countryKeys).toContain('US');
      expect(countryKeys).toContain('UK');
      expect(countryKeys).toHaveLength(2);
      done();
    });
  });

  it('should build mediaCompose with unique types from medias', (done) => {
    service.mediaCompose$.subscribe((data) => {
      const typeKeys = data.types.map((t) => t.key);
      expect(typeKeys).toContain('MEDIA');
      expect(typeKeys).toContain('ORGANIZATION');
      expect(typeKeys).toHaveLength(2);
      done();
    });
  });

  it('should build mediaCompose with unique regions from medias', (done) => {
    service.mediaCompose$.subscribe((data) => {
      const regionKeys = data.regions.map((r) => r.key);
      expect(regionKeys).toContain('NORTH_AMERICA');
      expect(regionKeys).toContain('EUROPE');
      done();
    });
  });

  it('should group medias by type in medias$', (done) => {
    service.medias$.subscribe((data) => {
      expect(data.length).toBeGreaterThan(0);
      const mediaGroup = data.find((g) => g.label === 'MEDIA');
      expect(mediaGroup).toBeDefined();
      expect(mediaGroup!.items.length).toBe(2);
      done();
    });
  });

  it('setFilterWord should POST to wordsfilter endpoint and return result', async () => {
    const mockResult = [{ name: 'word', count: 5 }];
    const filter = { type: 'MEDIA' };

    const promise = service.setFilterWord(filter);

    const req = httpMock.expectOne(`${environment.apiUrl}/filters/wordsfilter`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(filter);
    req.flush(mockResult);

    const result = await promise;
    expect(result).toEqual(mockResult);
  });

  it('getTranslatedMediaCompose should use trans.instant for each item', (done) => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;
    trans.instant.mockImplementation((key: string) => `t:${key}`);

    service.getTranslatedMediaCompose();

    service.mediaCompose$.subscribe((data) => {
      expect(data.countries.length).toBeGreaterThan(0);
      expect(trans.instant).toHaveBeenCalled();
      done();
    });
  });

  it('getTranslatedMediaCompose should sort items alphabetically by translated label', (done) => {
    const trans = TestBed.inject(TranslateService) as unknown as MockTranslateService;
    trans.instant.mockImplementation((key: string) => key);

    service.getTranslatedMediaCompose();

    service.mediaCompose$.subscribe((data) => {
      const types = data.types.map((t) => t.label);
      const sorted = [...types].sort((a, b) => a.localeCompare(b));
      expect(types).toEqual(sorted);
      done();
    });
  });
});
