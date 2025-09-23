import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import {
  CHART_COLORS,
  CHART_THEME,
  COUNT,
  NONE,
} from '../../../utils/constants';
import { Component, OnDestroy, OnInit, ViewChild, input } from '@angular/core';
import { DataChart } from '../../../models/chart.model';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface ChartOptions {
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
export class BarChartComponent implements OnInit, OnDestroy {
  readonly dataBarChart = input<DataChart>();

  @ViewChild('chart') chart: ChartComponent = new ChartComponent();

  chartOptions!: ChartOptions;

  chartSeries!: ApexAxisChartSeries;
  chartLabels!: string[];
  chartMode!: string;

  yTitle!: string;

  maxYValue: number | undefined;

  private subscriptions: Subscription[] = [];

  constructor(private trans: TranslateService) {}

  ngOnInit(): void {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) =>
      subscription.unsubscribe()
    );
  }

  private initialize(): void {
    this.chartMode = this.dataBarChart()?.translate || '';
    this.setTranslateChart();
    this.maxYValue = Array.isArray(this.chartSeries[0].data)
      ? Math.max(...(this.chartSeries[0].data as number[]))
      : undefined;
    this.chartOptionsUpdate(this.chartSeries, this.chartLabels);
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
          formatter: (val) => Math.round(val).toLocaleString(),
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

  private setTranslateChart(): void {
    // Initial translation
    this.setTranslate();
    this.yTitle = this.trans.instant('chart.' + COUNT);
    // Update translations when language changes
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.setTranslate();
      this.yTitle = this.trans.instant('chart.' + COUNT);
      this.chartOptionsUpdate(this.chartSeries, this.chartLabels);
    });
    this.subscriptions.push(langChangeSub);
  }

  private setTranslate(): void {
    if (this.chartMode !== NONE) {
      this.chartLabels =
        this.dataBarChart()?.xLabels?.map((label) =>
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
