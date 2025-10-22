import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import {
  CHART_COLORS,
  CHART_THEME,
  COUNT,
  NONE,
} from '../../../utils/constants';
import { ChartDialog, ChartFilter } from '../../../models/dialog.model';
import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import {
  dataChartDialog$,
  isShowChartDialog$,
} from '../../../utils/dialog-subjects';
import { DataChart } from '../../../models/chart.model';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  colors: string[];
}

@Component({
  selector: 'app-bar-chart',
  imports: [NgApexchartsModule],
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css',
})
export class BarChartComponent implements OnInit {
  readonly dataBarChart = input<DataChart>();
  readonly filterDialog = input<ChartFilter | undefined>();

  chartOptions!: ChartOptions;

  private chartSeries!: ApexAxisChartSeries;
  private chartLabels!: string[];
  private chartMode!: string;
  private yTitle!: string;
  private maxYValue: number | undefined;

  private chartDialog: ChartDialog | undefined;

  private trans = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initialize();
  }

  private initialize(): void {
    this.chartMode = this.dataBarChart()?.translate || NONE;

    if (this.filterDialog()) {
      this.chartDialog = new ChartDialog();
      this.chartDialog.media_id = this.filterDialog()?.media_id;
      this.chartDialog.type = this.filterDialog()?.type;
      this.chartDialog.country = this.filterDialog()?.country;
      this.chartDialog.region = this.filterDialog()?.region;
      this.chartDialog.rangeDates = this.filterDialog()?.rangeDates;
      this.chartDialog.valuation = this.chartMode; // Determine if this is a sentiment or ideology chart, word chart if NONE
    }
    this.setChart();
  }

  private chartOptionsUpdate(
    series: ApexAxisChartSeries,
    xlabels: string[]
  ): void {
    this.chartOptions = {
      series: series || [],
      chart: {
        ...CHART_THEME,
        type: 'bar',
        height: 400,
        width: '100%',
        events: {
          dataPointSelection: (_event, _chartContext, config) => {
            if (!this.chartDialog) return; // Do nothing if chartDialog is not defined

            if (
              config.seriesIndex !== undefined &&
              config.seriesIndex >= 0 &&
              config.dataPointIndex !== undefined &&
              config.dataPointIndex >= 0
            ) {
              const value =
                this.chartSeries[config.seriesIndex].data[
                  config.dataPointIndex
                ];

              const category =
                this.dataBarChart()?.xLabels?.[config.dataPointIndex] || '';

              this.chartDialog.value.set(category);
              this.chartDialog.count.set(Number(value));

              dataChartDialog$.next(this.chartDialog);
              isShowChartDialog$.next(true);
            }
          },
        },
      },

      dataLabels: {
        enabled: false,
      },
      xaxis: {
        labels: {
          style: {
            fontSize: '16px',
          },
          rotate: -45,
          trim: true,
        },
        categories: xlabels || [],
      },

      yaxis: {
        show: true,
        max: this.maxYValue,
        tickAmount: this.maxYValue ? 8 : undefined,
        min: 0,
        labels: {
          formatter: (val: number) => Math.round(val).toLocaleString(),
          style: {
            fontSize: '16px',
          },
        },
        title: {
          text: this.yTitle,
          style: {
            fontSize: '18px',
            fontWeight: 'semi-bold',
          },
        },
      },
      colors: CHART_COLORS,
    };
  }

  private setChart(): void {
    // Initial translation and setup chart
    this.setTranslate();
    this.yTitle = this.trans.instant('chart.' + COUNT);
    this.maxYValue = Array.isArray(this.chartSeries[0].data)
      ? Math.max(...(this.chartSeries[0].data as number[]))
      : undefined;
    this.chartOptionsUpdate(this.chartSeries, this.chartLabels);

    // Update translations when language changes
    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.setTranslate();
        this.yTitle = this.trans.instant('chart.' + COUNT);
        this.chartOptionsUpdate(this.chartSeries, this.chartLabels);
      });
  }

  private setTranslate(): void {
    if (this.chartMode !== NONE) {
      this.chartLabels =
        this.dataBarChart()?.xLabels?.map((label: string) =>
          this.trans.instant(this.chartMode + '.' + label)
        ) || [];
    } else if (this.chartLabels === undefined) {
      this.chartLabels = this.dataBarChart()?.xLabels || [];
    }
    this.chartSeries = this.dataBarChart()?.series.map((item) => {
      if (typeof item === 'object' && 'name' in item && item.name) {
        return {
          ...item,
          name: this.trans.instant('chart.count'),
        };
      }
      return item;
    }) as ApexAxisChartSeries;
  }
}
