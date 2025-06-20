import { Component, OnDestroy, OnInit, ViewChild, input } from '@angular/core';

import {
  ApexChart,
  ApexResponsive,
  ApexStroke,
  ApexTheme,
  ApexYAxis,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { CHART_THEME, IDEOLOGIES, NONE, SENTIMENTS } from '../../../utils/constants';
import { DataChart } from '../../../models/chart.model';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

export interface ChartOptions {
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
  styleUrl: './pie-chart.component.css',
})
export class PieChartComponent implements OnInit, OnDestroy {
  readonly dataPieChart = input<DataChart>();

  @ViewChild('chart') chart: ChartComponent = new ChartComponent();

  chartOptions!: ChartOptions;

  chartLabels!: string[];
  translateType!: string;

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
    if (this.dataPieChart()?.translate !== NONE) {
      this.translateType = this.dataPieChart()?.translate || '';
      this.setTranslateChart();
    } else {
      this.chartLabels = this.dataPieChart()?.xLabels || [];
    }
    this.chartOptionsUpdate(this.chartLabels);
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
        width: 500,
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
              width: 450,
            },
          },
        },
        {
          breakpoint: 1570,
          options: {
            chart: {
              width: 400,
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
              width: 500,
            },
          },
        },
        {
          breakpoint: 550,
          options: {
            chart: {
              width: 400,
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
    // Map colors to corresponding sentiment labels
    const sentimentColorMap: Record<string, string> = {
      NEGATIVES: 'var(--color-negative)',
      NEUTRALS: 'var(--color-neutral)',
      POSITIVES: 'var(--color-positive)',
    };
    // Set colors array in the same order as the labels
    this.chartOptions.colors =
      this.dataPieChart()?.xLabels?.map(
        (label) => sentimentColorMap[label] || 'var(--color-neutral)'
      ) || [];
  }

  private setIdeologiesColors(): void {
    // Map colors to corresponding ideologies labels
    const ideologieColorMap: Record<string, string> = {
      POLITICAL_SPECTRUM: 'var(--color-political-spectrum)',
      ECONOMIC_ORIENTATIONS: 'var(--color-economic-orientations)',
      POLITICAL_SYSTEMS: 'var(--color-political-systems)',
      NATIONAL_STANCES: 'var(--color-national-stances)',
      GEOPOLITICAL_ALIGNMENTS: 'var(--color-geopolitical-alignments)',
      RELIGIOUS_ORIENTATIONS: 'var(--color-religious-orientations)',
      SOCIAL_MOVEMENTS: 'var(--color-social-movements)',
      PHILOSOPHICAL_ORIENTATIONS: 'var(--color-philosophical-orientations)',
      EPISTEMOLOGICAL_ORIENTATIONS: 'var(--color-epistemological-orientations)'
    };
    // Set colors array in the same order as the labels
    this.chartOptions.colors =
      this.dataPieChart()?.xLabels?.map(
        (label) => ideologieColorMap[label] || 'var(--color-neutral)'
      ) || [];
  }

  private setTranslateChart(): void {
    // Initial translation
    this.chartLabels =
      this.dataPieChart()?.xLabels?.map((label) =>
        this.trans.instant(this.translateType + '.' + label)
      ) || [];

    // Update translations when language changes
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.chartLabels =
        this.dataPieChart()?.xLabels?.map((label) =>
          this.trans.instant(this.translateType + '.' + label)
        ) || [];
      this.chartOptionsUpdate(this.chartLabels);
    });
    this.subscriptions.push(langChangeSub);
  }
}
