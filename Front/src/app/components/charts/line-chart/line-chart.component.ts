import { Component, OnDestroy, OnInit, ViewChild, input } from '@angular/core';

import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexResponsive,
  ApexTheme,
  ApexXAxis,
  ApexYAxis,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { CHART_THEME, NONE } from '../../../utils/constants';
import { DataChart } from '../../../models/chart.model';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  theme: ApexTheme;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  markers: ApexMarkers;
  legend: ApexLegend;
  grid: ApexGrid;
  responsive: ApexResponsive[];
}

@Component({
  selector: 'app-line-chart',
  imports: [NgApexchartsModule],
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.css',
})
export class LineChartComponent implements OnInit, OnDestroy {
  readonly dataLineChart = input<DataChart>();

  @ViewChild('chart') chart: ChartComponent = new ChartComponent();

  chartOptions!: ChartOptions;

  chartSeries!: ApexAxisChartSeries;
  translateType!: string;

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
    if (this.dataLineChart()?.translate !== NONE) {
      this.translateType = this.dataLineChart()?.translate || '';
    }
    this.setTranslateChart();
    const maxValues: number[] = [];
    this.chartSeries.forEach((item) => {
      maxValues.push(Math.max(...(item.data as number[])));
    });
    this.maxYValue = maxValues.length > 0 ? Math.max(...maxValues) : undefined;
    this.chartOptionsUpdate(this.chartSeries);
  }

  private chartOptionsUpdate(series: ApexAxisChartSeries): void {
    this.chartOptions = {
      series: series,
      theme: {
        palette: 'palette2',
      },
      chart: {
        ...CHART_THEME,
        type: this.dataLineChart()?.type || 'line',
        height: 400,
        width: '100%',
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        labels: {
          show:
            (this.dataLineChart()?.xLabels?.length ?? 0) > 100 ? false : true,
          style: {
            fontSize: '16px',
          },
          rotate: -45,
        },
        categories: this.dataLineChart()?.xLabels || [],
      },
      yaxis: {
        show: true,
        max: this.maxYValue ? this.maxYValue + 1 : undefined,
        tickAmount: this.maxYValue && this.maxYValue > 12 ? 8 : undefined,
        min: 0,
        labels: {
          formatter: (val) => (val ? Math.round(val).toString() : '-'),
          style: {
            fontSize: '16px',
          },
        },
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      markers: {
        size: 4,
        // colors: ['#fff'],
        // strokeColors: ['#000'],
        hover: {
          size: 6,
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'center',
        floating: false,
        fontSize: '16px',
        fontWeight: 600,
        offsetX: 0,
        offsetY: 0,
      },
      responsive: [
        {
          breakpoint: 1000,
          options: {
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    };
  }

  private setTranslateChart(): void {
    // Initial translation
    if (this.dataLineChart()?.translate !== NONE) {
      this.setTranslate();
    }

    // Update translations when language changes
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      if (this.dataLineChart()?.translate !== NONE) {
        this.setTranslate();
      }
      this.chartOptionsUpdate(this.chartSeries);
    });
    this.subscriptions.push(langChangeSub);
  }

  private setTranslate(): void {
    // It's ApexAxisChartSeries - translate the name property
    this.chartSeries = this.dataLineChart()?.series.map((item) => {
      if (typeof item === 'object' && 'name' in item && item.name) {
        return {
          ...item,
          name: this.trans.instant(this.translateType + '.' + item.name),
        };
      }
      return item;
    }) as ApexAxisChartSeries;
  }
}
