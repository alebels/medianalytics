import { HTTP_INTERCEPTORS, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { InterceptorService } from './interceptor.service';

describe('InterceptorService', () => {
  let service: InterceptorService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: InterceptorService,
          multi: true
        }
      ]
    });
    service = new InterceptorService();
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add default headers to requests', () => {
    const testUrl = '/api/test';
    
    httpClient.get(testUrl).subscribe();

    const req = httpMock.expectOne(testUrl);
    
    expect(req.request.headers.get('Accept')).toBe('application/json');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    expect(req.request.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
    expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    
    req.flush({});
  });

  it('should handle rate limit error (429)', () => {
    const testUrl = '/api/test';
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    httpClient.get(testUrl).subscribe({
      next: () => { /* handle success */ },
      error: () => { /* handle error */ },
      complete: () => { /* handle complete */ }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Rate limited', { 
      status: 429, 
      statusText: 'Too Many Requests',
      headers: { 'Retry-After': '60' }
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/Rate limited/));
    consoleSpy.mockRestore();
  });

  it('should handle server errors (5xx)', () => {
    const testUrl = '/api/test';
    let errorResponse: HttpErrorResponse | undefined;
    
    httpClient.get(testUrl).subscribe({
      next: () => fail('Expected error'),
      error: (error) => { errorResponse = error; }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    expect(errorResponse?.status).toBe(500);
  });

  it('should handle 404 errors gracefully', () => {
    const testUrl = '/api/notfound';
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    httpClient.get(testUrl).subscribe({
      next: () => { /* handle success */ },
      error: () => { /* handle error */ },
      complete: () => { /* handle complete */ }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(consoleSpy).toHaveBeenCalledWith('HTTP Error:', expect.any(Object));
    consoleSpy.mockRestore();
  });

  it('should handle 403 forbidden errors', () => {
    const testUrl = '/api/forbidden';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    httpClient.get(testUrl).subscribe({
      next: () => { /* handle success */ },
      error: () => { /* handle error */ },
      complete: () => { /* handle complete */ }
    });

    const req = httpMock.expectOne(testUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(consoleSpy).toHaveBeenCalledWith('Access forbidden - check NGINX configuration or authentication');
    consoleSpy.mockRestore();
  });
});
