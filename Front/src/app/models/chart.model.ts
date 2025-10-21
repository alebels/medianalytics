import { ApexAxisChartSeries, ChartType } from 'ng-apexcharts';
import { NONE } from '../utils/constants';

export class DataChart {
  constructor(
    public readonly xLabels: string[] = [],
    public readonly series: ApexAxisChartSeries | number[] = [],
    public readonly type: ChartType = 'bar',
    public translate: string = NONE
  ) {}
}

export class CompoundDataCharts {
  constructor(
    public readonly plain: DataChart = new DataChart(),
    public readonly categorized: DataChart = new DataChart()
  ) {}
}
