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

  private autoLoadSetup = false;
  private strategy: VariableSizeVirtualScrollStrategy | null = null;

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
        // Store strategy reference for reuse
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.strategy = (viewport as any)
          ._scrollStrategy as VariableSizeVirtualScrollStrategy;

        // Use queueMicrotask to defer setup until after current execution
        queueMicrotask(() => {
          if (viewport && this.dataSource && !this.autoLoadSetup) {
            this.setupAutoLoad();
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

  onClose(): void {
    isShowChartDialog$.next(false);
  }

  /**
   * Sets up automatic loading when user scrolls near bottom.
   * Integrates with the VariableSizeVirtualScrollStrategy.
   */
  private setupAutoLoad(): void {
    if (this.autoLoadSetup || !this.strategy) return;

    if (!this.strategy.setOnNearBottom) return;

    this.strategy.setOnNearBottom(() => void this.handleAutoLoad());
    this.autoLoadSetup = true;
  }

  /**
   * Handles automatic data loading when near bottom is detected.
   */
  private async handleAutoLoad(): Promise<void> {
    if (
      !this.strategy ||
      !this.dataSource?.hasMoreSync() ||
      this.dataSource.isLoadingSync()
    ) {
      this.strategy?.resetLoadingFlag();
      return;
    }

    await this.dataSource.loadMore();

    // Invalidate size cache only for items that were modified (URLs aggregated)
    // This is much more efficient than invalidating everything
    const modifiedIndices = this.dataSource.lastModifiedIndices;
    if (modifiedIndices.length > 0) {
      this.strategy.invalidateItemSizeCache(modifiedIndices);
    }

    this.strategy.resetLoadingFlag();
  }

  private initializeDataSource(): void {
    const chartData = this.dataChartDialog();
    if (!chartData) return;

    // Clean up previous datasource
    if (this.dataSource) {
      this.dataSource.disconnect();
      // Reset strategy state when datasource changes
      this.strategy?.reset();
      this.dataSource = undefined;
    }

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
