import {
  ApexChart,
  ApexResponsive,
  ApexStroke,
  ApexTheme,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { CHART_THEME, IDEOLOGIES, SENTIMENTS } from '../../../utils/constants';
import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { DataChart } from '../../../models/chart.model';
import { SentimentIdeologyService } from '../../../services/sentiment-ideology.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface ChartOptions {
  series: number[];
  chart: ApexChart;
  labels: string[];
  theme: ApexTheme;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  legend: ApexLegend;
  colors: string[];
  responsive: ApexResponsive[];
}

@Component({
  selector: 'app-pie-chart',
  imports: [NgApexchartsModule],
  templateUrl: './pie-chart.component.html',
})
export class PieChartComponent implements OnInit {
  readonly dataPieChart = input<DataChart>();

  chartOptions!: ChartOptions;

  private chartLabels!: string[];
  private translateType!: string;

  private trans = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private sentimentIdeologySrv = inject(SentimentIdeologyService);

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.translateType = this.dataPieChart()?.translate || '';
    this.setTranslateChart();
  }

  private chartOptionsUpdate(xlabels: string[]): void {
    this.chartOptions = {
      series: (this.dataPieChart()?.series as number[]) || [],
      chart: {
        ...CHART_THEME,
        type: this.dataPieChart()?.type || 'donut',
        selection: {
          enabled: false,
        },
        width: 470,
      },

      labels: xlabels || [],
      stroke: {
        width: 2,
      },
      yaxis: {
        show: false,
      },
      legend: {
        show: true,
        floating: false,
        position: 'bottom',
        fontSize: '16px',
        fontWeight: 600,
        offsetX: 0,
        offsetY: 0,
      },
      theme: {
        palette: 'palette7',
      },
      colors: [],

      responsive: [
        {
          breakpoint: 1755,
          options: {
            chart: {
              width: 430,
            },
          },
        },
        {
          breakpoint: 1570,
          options: {
            chart: {
              width: 390,
            },
          },
        },
        {
          breakpoint: 1415,
          options: {
            chart: {
              width: 350,
            },
          },
        },
        {
          breakpoint: 1245,
          options: {
            chart: {
              width: 420,
            },
          },
        },
        {
          breakpoint: 550,
          options: {
            chart: {
              width: 390,
            },
          },
        },
        {
          breakpoint: 450,
          options: {
            chart: {
              width: 320,
            },
          },
        },
      ],
    };

    if (this.dataPieChart()?.translate === SENTIMENTS) {
      this.setSentimentColors();
    } else if (this.dataPieChart()?.translate === IDEOLOGIES) {
      this.setIdeologiesColors();
    }
  }

  private setSentimentColors(): void {
    this.chartOptions.colors =
      this.dataPieChart()?.xLabels?.map(
        (label) =>
          this.sentimentIdeologySrv.getCategoryColor(label, SENTIMENTS) ||
          'var(--color-accent)',
      ) || [];
  }

  private setIdeologiesColors(): void {
    this.chartOptions.colors =
      this.dataPieChart()?.xLabels?.map(
        (label) =>
          this.sentimentIdeologySrv.getCategoryColor(label, IDEOLOGIES) ||
          'var(--color-accent)',
      ) || [];
  }

  private setTranslateChart(): void {
    // Initial translation
    this.chartLabels =
      this.dataPieChart()?.xLabels?.map((label: string) =>
        this.trans.instant(this.translateType + '.' + label),
      ) || [];
    this.chartOptionsUpdate(this.chartLabels);

    // Update translations when language changes
    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.chartLabels =
          this.dataPieChart()?.xLabels?.map((label: string) =>
            this.trans.instant(this.translateType + '.' + label),
          ) || [];
        this.chartOptions.labels = this.chartLabels;
      });

    // Update colors when category data arrives/updates
    if (this.translateType === SENTIMENTS) {
      this.sentimentIdeologySrv.sentiments$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.setSentimentColors();
        });
    } else if (this.translateType === IDEOLOGIES) {
      this.sentimentIdeologySrv.ideologies$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.setIdeologiesColors();
        });
    }
  }
}
