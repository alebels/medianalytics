import { EMPTY, Observable, catchError, throwError } from 'rxjs';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class InterceptorService implements HttpInterceptor {

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {

    // Add default headers for FastAPI backend
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Prevent caching
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    });

    // Clone request with new headers
    const reqClone = req.clone({ headers });

    return next.handle(reqClone).pipe(
      catchError((error: HttpErrorResponse) => {
        this.handleError(error);
        
        // Enhanced error handling
        if (error.status === 429) {
          // Rate limited - extract retry-after header if available
          const retryAfter = error.headers?.get('Retry-After');
          console.warn(`Rate limited - retry after ${retryAfter || '60'} seconds`);
        }
        
        if (error.status === 403) {
          console.error('Access forbidden - check configuration or authentication');
        }
        
        // Return empty for non-critical errors, or rethrow for critical ones
        if (error.status >= 500) {
          return throwError(() => error); // Let component handle server errors
        }
        
        return EMPTY; // Complete gracefully for client errors
      })
    );
  }

  private handleError(error: HttpErrorResponse): void {
    let errorMessage = 'An unknown error occurred';

    if (error.status === 0) {
      errorMessage =
        'Backend connection failed. Please check if the server is running.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized access. Please check your credentials.';
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. Insufficient permissions.';
    } else if (error.status === 404) {
      errorMessage = `Resource not found: ${error.url}`;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please slow down and try again later.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error && error.error.message) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    // Enhanced logging with more context
    console.warn('HTTP Error:', {
      status: error.status,
      statusText: error.statusText,
      message: errorMessage,
      url: error.url,
      method: error.url ? 'Unknown' : 'GET', // Add method if available
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });
  }
}
