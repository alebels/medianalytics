import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { HttpClient } from '@angular/common/http';

import {
  ChartDialogPaginated,
  ChartDialogPaginatedRead,
  ChartDialogValue,
  DialogRow,
} from '../../../models/dialog.model';
import { environment } from '../../../../environments/environment';

/**
 * Custom DataSource for loading media items with virtual scrolling support.
 * Uses a normalized flat data model where each row is either a media header
 * or an individual URL, enabling fixed-height virtual scroll items.
 *
 * Key features:
 * - Flattens API responses into uniform DialogRow items (header | url)
 * - Each row is ~60px, enabling CDK FixedSizeVirtualScrollStrategy
 * - Media metadata stored once per media via knownMedias map
 * - No large aggregated objects in memory
 * - No scroll jumps due to uniform item heights
 */
export class MediaItemDataSource extends DataSource<DialogRow> {
  // Flat list of rows: headers and individual URLs
  private _cachedData: DialogRow[] = [];

  // Track known media names and their URL counts to handle cross-page grouping
  private _knownMedias = new Map<string, number>();

  // Current page number for pagination (1-based to match API convention)
  private _currentPage = 1;

  // Flag indicating if more data is available to load
  private _hasMore = true;

  // Flag to prevent concurrent load operations
  private _isLoading = false;

  // Flag to track if initial load has completed
  private _initialized = false;

  // BehaviorSubject emitting current flat rows to subscribers (virtual scroll viewport)
  private readonly _dataStream = new BehaviorSubject<DialogRow[]>([]);

  // BehaviorSubject tracking loading state for UI indicators
  private readonly _loadingStream = new BehaviorSubject<boolean>(false);

  private readonly apiUrl = environment.apiUrl + '/filters';

  constructor(
    private http: HttpClient,
    private filterParams: ChartDialogValue,
  ) {
    super();
  }

  connect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _collectionViewer: CollectionViewer,
  ): Observable<DialogRow[]> {
    // Initialize data on first connect if not already done
    if (!this._initialized) {
      this._initializeDataSource();
    }
    return this._dataStream.asObservable();
  }

  disconnect(): void {
    this._cachedData = [];
    this._knownMedias.clear();
    this._dataStream.complete();
    this._loadingStream.complete();
  }

  get loading$(): Observable<boolean> {
    return this._loadingStream.asObservable();
  }

  /**
   * Returns the current cached flat rows array.
   */
  get cachedData(): DialogRow[] {
    return this._cachedData;
  }

  /**
   * Synchronously returns whether more data can be loaded.
   */
  hasMoreSync(): boolean {
    return this._hasMore;
  }

  /**
   * Synchronously returns whether data is currently being loaded.
   */
  isLoadingSync(): boolean {
    return this._isLoading;
  }

  /**
   * Loads the next page of data from the API.
   * Flattens API results into header/url rows, handling cross-page media grouping.
   */
  async loadMore(): Promise<void> {
    if (this._isLoading || !this._hasMore) return;

    this._isLoading = true;
    this._loadingStream.next(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const response = await this._fetchMediaItemsFromAPI(this._currentPage);

      this._hasMore = response.has_more;

      if (!response.results?.length) {
        this._hasMore = false;
        return;
      }

      this._flattenResults(response.results);
      this._currentPage++;

      // Emit same reference - array was modified in-place via push
      this._dataStream.next(this._cachedData);
    } finally {
      this._isLoading = false;
      this._loadingStream.next(false);
    }
  }

  /**
   * Flattens API results into header and URL rows.
   * If a media was already seen in a previous page, skips the header
   * and continues URL numbering from where it left off.
   */
  private _flattenResults(
    results: {
      media_name: string;
      urls: { url: string; frequency?: number }[];
    }[],
  ): void {
    for (const item of results) {
      const existingUrlCount = this._knownMedias.get(item.media_name) || 0;

      if (existingUrlCount === 0) {
        this._cachedData.push({ type: 'header', mediaName: item.media_name });
      }

      let urlIndex = existingUrlCount + 1;
      for (const urlItem of item.urls) {
        this._cachedData.push({
          type: 'url',
          mediaName: item.media_name,
          url: urlItem.url,
          frequency: urlItem.frequency,
          urlIndex: urlIndex++,
        });
      }

      this._knownMedias.set(
        item.media_name,
        existingUrlCount + item.urls.length,
      );
    }
  }

  /**
   * Initializes the data source by fetching the first page.
   */
  private async _initializeDataSource(): Promise<void> {
    if (this._initialized) return;

    this._isLoading = true;
    this._loadingStream.next(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const response = await this._fetchMediaItemsFromAPI(1);

      this._hasMore = response.has_more;

      this._cachedData = [];
      this._knownMedias.clear();
      this._flattenResults(response.results);

      this._currentPage = 2;
      this._initialized = true;

      this._dataStream.next(this._cachedData);
    } catch {
      this._cachedData = [];
      this._initialized = true;
      this._dataStream.next(this._cachedData);
    } finally {
      this._isLoading = false;
      this._loadingStream.next(false);
    }
  }

  /**
   * Fetches paginated chart dialog data from the API.
   */
  private async getChartDialogPaginated(
    params: ChartDialogPaginated,
  ): Promise<ChartDialogPaginatedRead> {
    return await firstValueFrom(
      this.http.post<ChartDialogPaginatedRead>(
        `${this.apiUrl}/chartdialog/paginated`,
        params,
      ),
    );
  }

  /**
   * Fetches media items from the API for a specific page.
   */
  private async _fetchMediaItemsFromAPI(
    page: number,
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
