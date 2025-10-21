import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';

import {
  ChartDialogPaginated,
  ChartDialogPaginatedRead,
  ChartDialogValue,
  ItemDialog,
} from '../../../models/dialog.model';
import { environment } from '../../../../environments/environment';

/**
 * Custom DataSource for loading media items with virtual scrolling support.
 * Implements progressive loading pattern with "Load More" button trigger.
 * 
 * Key features:
 * - Dynamically grows cache array as data is loaded (no pre-allocation)
 * - Groups items by media_name to aggregate URLs across pages
 * - Maintains stable array references to prevent scroll position reset
 * - Smooth progressive scrolling without jumps
 */
export class MediaItemDataSource extends DataSource<ItemDialog> {
  
  // In-memory cache that grows progressively as data is loaded
  // Contains only actual ItemDialog objects for smooth scrolling
  private _cachedData: ItemDialog[] = [];
  
  // Current page number for pagination (1-based to match API convention)
  private _currentPage = 1;
  
  // Flag indicating if more data is available to load
  private _hasMore = true;
  
  // Flag to prevent concurrent load operations
  private _isLoading = false;
  
  // Flag to track if initial load and array allocation has completed
  private _initialized = false;

  // BehaviorSubject emitting current cache state to subscribers (virtual scroll viewport)
  private readonly _dataStream = new BehaviorSubject<ItemDialog[]>([]);
  
  // BehaviorSubject tracking loading state for UI indicators
  private readonly _loadingStream = new BehaviorSubject<boolean>(false);
  
  // BehaviorSubject tracking if more data can be loaded
  private readonly _hasMoreStream = new BehaviorSubject<boolean>(true);

  private readonly apiUrl = environment.apiUrl + '/filters';

  constructor(
    private http: HttpClient,
    private filterParams: ChartDialogValue
  ) {
    super();
  }

  connect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _collectionViewer: CollectionViewer
  ): Observable<ItemDialog[]> {
    // Initialize data on first connect if not already done
    if (!this._initialized) {
      this._initializeDataSource();
    }
    return this._dataStream.asObservable();
  }

  disconnect(): void {
    this._cachedData = [];
    this._dataStream.complete();
    this._loadingStream.complete();
    this._hasMoreStream.complete();
  }

  get loading$(): Observable<boolean> {
    return this._loadingStream.asObservable();
  }

  /**
   * Returns the current cached data array.
   * Used for calculating global URL indices across all items.
   */
  get cachedData(): ItemDialog[] {
    return this._cachedData;
  }

  /**
   * Synchronously returns whether more data can be loaded.
   * Used by auto-load functionality to check before triggering load.
   */
  hasMoreSync(): boolean {
    return this._hasMore;
  }

  /**
   * Synchronously returns whether data is currently being loaded.
   * Prevents concurrent load operations.
   */
  isLoadingSync(): boolean {
    return this._isLoading;
  }

  /**
   * Loads the next page of data from the API.
   * - Prevents concurrent loads and respects hasMore flag
   * - Aggregates URLs for items with same media_name
   * - Appends new items to cache for smooth progressive loading
   * - Maintains stable array reference to prevent scroll position reset
   */
  async loadMore(): Promise<void> {
    if (this._isLoading || !this._hasMore) return;

    this._isLoading = true;
    this._loadingStream.next(true);

    try {
      const response = await this._fetchMediaItemsFromAPI(this._currentPage);

      this._hasMore = response.has_more;
      this._hasMoreStream.next(this._hasMore);

      if (!response.results?.length) {
        this._hasMore = false;
        this._hasMoreStream.next(false);
        return;
      }

      // Process new items: merge with existing or append new
      response.results.forEach((newItem) => {
        const existingIndex = this._cachedData.findIndex(
          (cached) => cached?.media_name === newItem.media_name
        );

        if (existingIndex !== -1 && this._cachedData[existingIndex]) {
          // Aggregate URLs into existing item (in-place modification)
          this._cachedData[existingIndex]!.urls.push(...newItem.urls);
        } else {
          // Append new item to cache
          this._cachedData.push(newItem);
        }
      });

      this._currentPage++;
      
      // Emit updated data for virtual scroll
      this._dataStream.next(this._cachedData);
    } catch {
      this._hasMore = false;
      this._hasMoreStream.next(false);
    } finally {
      this._isLoading = false;
      this._loadingStream.next(false);
    }
  }

  /**
   * Initializes the data source by fetching the first page and setting up the cache.
   * - Makes initial API call to get total count and first page data
   * - Builds cache array dynamically without pre-allocation for better scroll behavior
   * - Loads and inserts first page of data
   */
  private async _initializeDataSource(): Promise<void> {
    if (this._initialized) return;

    this._isLoading = true;
    this._loadingStream.next(true);

    try {
      const response = await this._fetchMediaItemsFromAPI(1);

      this._hasMore = response.has_more;
      this._hasMoreStream.next(this._hasMore);

      // Initialize cache with first page data only (no pre-allocation)
      this._cachedData = [...response.results];

      this._currentPage = 2;
      this._initialized = true;

      this._dataStream.next(this._cachedData);
    } catch {
      this._cachedData = [];
      this._initialized = true;
      this._hasMore = false;
      this._hasMoreStream.next(false);
      this._dataStream.next(this._cachedData);
    } finally {
      this._isLoading = false;
      this._loadingStream.next(false);
    }
  }

  /**
   * Fetches paginated chart dialog data from the API.
   * Wrapper around HTTP POST request with proper typing.
   * 
   * @param params - Pagination and filter parameters
   * @returns Promise resolving to paginated response with results and metadata
   */
  private async getChartDialogPaginated(
    params: ChartDialogPaginated
  ): Promise<ChartDialogPaginatedRead> {
    return await firstValueFrom(
      this.http.post<ChartDialogPaginatedRead>(
        `${this.apiUrl}/chartdialog/paginated`,
        params
      )
    );
  }

  /**
   * Fetches media items from the API for a specific page.
   * Constructs request payload with filter params and pagination info.
   * 
   * @param page - Page number to fetch (1-based)
   * @returns Promise resolving to response with results, total count, and hasMore flag
   */
  private async _fetchMediaItemsFromAPI(
    page: number
  ): Promise<ChartDialogPaginatedRead> {
    const requestPayload: ChartDialogPaginated = {
      ...this.filterParams,
      pagination: {
        page: page,
      },
    };

    const response: ChartDialogPaginatedRead =
      await this.getChartDialogPaginated(requestPayload);

    if (!response) {
      throw new Error('No response from API');
    }

    return response;
  }
}
