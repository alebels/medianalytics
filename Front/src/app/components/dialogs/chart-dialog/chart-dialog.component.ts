import {
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
  DialogRow,
} from '../../../models/dialog.model';
import { IDEOLOGIES, NONE, SENTIMENTS } from '../../../utils/constants';
import { filter, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { HttpClient } from '@angular/common/http';
import { MediaItemDataSource } from './media-item-source';
import { ProgressBar } from 'primeng/progressbar';
import { TranslatePipe } from '@ngx-translate/core';
import { isShowChartDialog$ } from '../../../utils/dialog-subjects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chart-dialog',
  imports: [
    CommonModule,
    DialogModule,
    TranslatePipe,
    ScrollingModule,
    ProgressBar,
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

  readonly ITEM_HEIGHT = 60;
  readonly LOAD_THRESHOLD = 750;
  readonly NONE = NONE;

  private autoLoadSetup = false;

  private readonly destroyRef = inject(DestroyRef);
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
      this.title(); // React to title changes which depend on dataChartDialog
      const viewport = this.virtualScroll();
      if (viewport && this.dataSource && !this.autoLoadSetup) {
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
    isShowChartDialog$.next(false);
  }

  trackByRow(index: number, row: DialogRow): string {
    if (row.type === 'header') {
      return `h-${row.mediaName}`;
    }
    return `u-${row.mediaName}-${row.urlIndex}`;
  }

  onClose(): void {
    isShowChartDialog$.next(false);
  }

  /**
   * Sets up automatic loading when user scrolls near bottom.
   * Uses the viewport's elementScrolled observable with CDK's built-in fixed strategy.
   */
  private setupAutoLoad(viewport: CdkVirtualScrollViewport): void {
    if (this.autoLoadSetup) return;
    this.autoLoadSetup = true;

    // Reset CDK scroll position after initial data load to prevent wrong translateY offset
    this.dataSource!.loading$.pipe(
      filter((loading) => !loading),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      viewport.scrollToOffset(0);
      viewport.checkViewportSize();
    });

    viewport
      .elementScrolled()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.checkNearBottom(viewport);
      });
  }

  /**
   * Checks if user scrolled near bottom and triggers data loading.
   */
  private checkNearBottom(viewport: CdkVirtualScrollViewport): void {
    if (!this.dataSource?.hasMoreSync() || this.dataSource.isLoadingSync()) {
      return;
    }

    const scrollOffset = viewport.measureScrollOffset();
    const viewportSize = viewport.getViewportSize();
    const totalSize = viewport.getDataLength() * this.ITEM_HEIGHT;
    const distanceFromBottom = totalSize - (scrollOffset + viewportSize);

    if (distanceFromBottom < this.LOAD_THRESHOLD) {
      this.dataSource.loadMore();
    }
  }

  private initializeDataSource(): void {
    const chartData = this.dataChartDialog();
    if (!chartData) return;

    // Clean up previous datasource
    if (this.dataSource) {
      this.dataSource.disconnect();
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
        (date: Date) => date.toISOString().split('T')[0],
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
