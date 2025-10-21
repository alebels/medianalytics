import {
  CdkVirtualScrollViewport,
  ScrollingModule,
  VIRTUAL_SCROLL_STRATEGY,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {
  ChartDialog,
  ChartDialogValue,
  ItemDialog,
} from '../../../models/dialog.model';
import { IDEOLOGIES, NONE, SENTIMENTS } from '../../../utils/constants';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { MediaItemDataSource } from './media-item-source';
import { ProgressBar } from 'primeng/progressbar';
import { TranslatePipe } from '@ngx-translate/core';
import { VariableSizeVirtualScrollStrategy } from './variable-size-virtual-scroll-strategy';
import { isShowChartDialog$ } from '../../../utils/dialog-subjects';

@Component({
  selector: 'app-chart-dialog',
  imports: [
    CommonModule,
    DialogModule,
    TranslatePipe,
    ScrollingModule,
    ProgressBar,
  ],
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: () => {
        return new VariableSizeVirtualScrollStrategy(100, 400, 800);
      },
    },
  ],
  templateUrl: './chart-dialog.component.html',
  styleUrl: './chart-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDialogComponent implements OnDestroy {
  readonly dataChartDialog = input<ChartDialog>();
  readonly virtualScroll = viewChild<CdkVirtualScrollViewport>('virtualScroll');

  count = computed(() => this.dataChartDialog()?.count() || 0);

  dataSource: MediaItemDataSource | undefined = undefined;

  // Translation key for the title (e.g., "sentiments.positive" or just "word")
  title = computed(() => {
    let title = '';

    if (
      this.dataChartDialog()?.valuation &&
      this.dataChartDialog()?.valuation !== NONE &&
      this.dataChartDialog()?.value()
    ) {
      title = `${
        this.dataChartDialog()?.valuation
      }.${this.dataChartDialog()?.value()}`;
    } else if (this.dataChartDialog()?.value()) {
      title = `${this.dataChartDialog()?.value()}`;
    }
    return title;
  });

  isVisible = true;

  readonly NONE = NONE;

  private urlOffsetCache: number[] = [];
  private frequencyCache = new Map<string, number | null>();
  private autoLoadSetup = false;

  private readonly http = inject(HttpClient);

  constructor() {
    effect(() => {
      const chartData = this.dataChartDialog();
      if (chartData && chartData.value()) {
        this.initializeDataSource();
      }
    });

    // Set up auto-load when both viewport and datasource are ready
    effect(() => {
      const viewport = this.virtualScroll();
      if (viewport && this.dataSource && !this.autoLoadSetup) {
        // Use queueMicrotask to defer setup until after current execution
        queueMicrotask(() => {
          if (viewport && this.dataSource && !this.autoLoadSetup) {
            this.setupAutoLoad(viewport);
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSource) {
      this.dataSource.disconnect();
      this.dataSource = undefined;
    }
  }

  trackByItemId(index: number, item: ItemDialog): string {
    return `${item.media_name}-${index}`;
  }

  trackByUrl(
    index: number,
    urlItem: { url: string; frequency?: number }
  ): string {
    return `${index}-${urlItem.url}`;
  }

  /**
   * Calculates the global URL index across all media items.
   * @param mediaIndex - Index of the media item in the list
   * @param urlIndex - Index of the URL within its media item
   * @returns Global index starting from 1
   */
  getGlobalUrlIndex(mediaIndex: number, urlIndex: number): number {
    if (!this.dataSource) return urlIndex + 1;

    // Rebuild cache if it's empty or stale (lazy initialization)
    if (this.urlOffsetCache.length === 0) {
      this.rebuildUrlOffsetCache();
    }

    // O(1) lookup from pre-calculated cumulative offsets
    const offset = this.urlOffsetCache[mediaIndex] ?? 0;
    return offset + urlIndex + 1;
  }

  /**
   * Calculates the total frequency for all URLs in a media item (optimized with caching).
   * O(1) lookup for repeated calls with same media_name.
   *
   * @param item - The media item containing URLs with optional frequency
   * @returns Total frequency sum, or null if no frequencies exist
   */
  getTotalFrequency(item: ItemDialog): number | null {
    // Check cache first - O(1) lookup
    if (this.frequencyCache.has(item.media_name)) {
      return this.frequencyCache.get(item.media_name)!;
    }

    // Calculate sum only once per media_name
    const total = item.urls.reduce((sum, urlItem) => {
      return sum + (urlItem.frequency ?? 0);
    }, 0);

    // Cache the result (null if no frequencies exist)
    const result = total > 0 ? total : null;
    this.frequencyCache.set(item.media_name, result);

    return result;
  }

  onClose(): void {
    isShowChartDialog$.next(false);
  }

  /**
   * Sets up automatic loading when user scrolls near bottom.
   * Integrates with the VariableSizeVirtualScrollStrategy.
   */
  private setupAutoLoad(viewport: CdkVirtualScrollViewport): void {
    if (this.autoLoadSetup) return;

    // Access the scroll strategy from the viewport's internal property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const strategy = (viewport as any)
      ._scrollStrategy as VariableSizeVirtualScrollStrategy;

    if (!strategy?.setOnNearBottom) return;

    strategy.setOnNearBottom(() => void this.handleAutoLoad(strategy));
    this.autoLoadSetup = true;
  }

  /**
   * Handles automatic data loading when near bottom is detected.
   * @param strategy - The scroll strategy to reset loading flag after completion
   */
  private async handleAutoLoad(
    strategy: VariableSizeVirtualScrollStrategy
  ): Promise<void> {
    if (!this.dataSource?.hasMoreSync() || this.dataSource.isLoadingSync()) {
      strategy.resetLoadingFlag();
      return;
    }

    await this.dataSource.loadMore();

    // Rebuild URL offset cache for accurate indexing
    this.rebuildUrlOffsetCache();
    
    // Clear frequency cache since URLs may have been aggregated into existing items
    this.frequencyCache.clear();

    strategy.resetLoadingFlag();
  }

  private rebuildUrlOffsetCache(): void {
    if (!this.dataSource) return;

    const cachedData = this.dataSource.cachedData;
    const cache: number[] = new Array(cachedData.length);

    let cumulativeCount = 0;
    for (let i = 0; i < cachedData.length; i++) {
      cache[i] = cumulativeCount;
      cumulativeCount += cachedData[i]?.urls.length ?? 0;
    }

    this.urlOffsetCache = cache;
  }

  private initializeDataSource(): void {
    const chartData = this.dataChartDialog();
    if (!chartData) return;

    // Clean up previous datasource
    if (this.dataSource) {
      this.dataSource.disconnect();
      this.dataSource = undefined;
    }

    // Clear caches and reset state when datasource changes
    this.urlOffsetCache = [];
    this.frequencyCache.clear();
    this.autoLoadSetup = false;

    // Build filter parameters from chart data
    const filterParams = new ChartDialogValue();
    if (chartData.media_id) filterParams.media_id = chartData.media_id;
    if (chartData.type) filterParams.type = chartData.type;
    if (chartData.country) filterParams.country = chartData.country;
    if (chartData.region) filterParams.region = chartData.region;
    if (chartData.rangeDates) {
      filterParams.dates = chartData.rangeDates.map(
        (date: Date) => date.toISOString().split('T')[0]
      );
    }
    if (chartData.valuation === SENTIMENTS) {
      filterParams.sentiment = chartData.value();
    }
    if (chartData.valuation === IDEOLOGIES) {
      filterParams.ideology = chartData.value();
    }
    if (chartData.valuation === NONE) {
      filterParams.word = chartData.value();
    }

    this.dataSource = new MediaItemDataSource(this.http, filterParams);
  }
}
