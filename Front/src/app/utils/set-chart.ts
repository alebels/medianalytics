import { ItemRead, ItemSerie } from '../models/items.model';
import { DataChart } from '../models/chart.model';

export function setToBarChart(data: ItemRead[], label: string): DataChart {
  const labels = data.map((item) => item.name);
  const counts = data.map((item) => item.count);
  const series = [
    {
      name: label,
      data: counts,
    },
  ];
  return new DataChart(labels, series, 'bar');
}

export function setToLineChart(data: ItemSerie[], labels: string[]): DataChart {
  return new DataChart(labels, data, 'line');
}

export function setToPieChart(data: ItemRead[]): DataChart {
  const labels = data.map((item) => item.name);
  const series = data.map((item) => item.count);
  return new DataChart(labels, series, 'donut');
}
