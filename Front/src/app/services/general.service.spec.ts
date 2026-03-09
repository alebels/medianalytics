import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { GeneralService } from './general.service';
import { HttpClient } from '@angular/common/http';
import { MinMaxDateRead } from '../models/items.model';
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

  it('should expose minMaxDate$ observable', () => {
    let received: MinMaxDateRead | undefined;
    service.minMaxDate$.subscribe(d => { received = d; });
    expect(received).toBeInstanceOf(MinMaxDateRead);
  });

});
