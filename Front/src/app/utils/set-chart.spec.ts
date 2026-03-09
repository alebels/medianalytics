import { ItemRead, ItemSerie } from '../models/items.model';
import { setToBarChart, setToLineChart, setToPieChart } from './set-chart';
import { DataChart } from '../models/chart.model';

describe('set-chart utilities', () => {
  describe('setToBarChart', () => {
    it('should return a DataChart with type bar', () => {
      const data: ItemRead[] = [{ name: 'A', count: 10 }];
      const result = setToBarChart(data, 'Label');

      expect(result).toBeInstanceOf(DataChart);
      expect(result.type).toBe('bar');
    });

    it('should map item names to xLabels', () => {
      const data: ItemRead[] = [
        { name: 'Word1', count: 5 },
        { name: 'Word2', count: 15 },
      ];
      const result = setToBarChart(data, 'Count');

      expect(result.xLabels).toEqual(['Word1', 'Word2']);
    });

    it('should map item counts to series data', () => {
      const data: ItemRead[] = [
        { name: 'A', count: 5 },
        { name: 'B', count: 20 },
      ];
      const result = setToBarChart(data, 'Count');

      expect((result.series as { name: string; data: number[] }[])[0].data).toEqual([5, 20]);
    });

    it('should use the provided label as series name', () => {
      const data: ItemRead[] = [{ name: 'test', count: 1 }];
      const result = setToBarChart(data, 'Custom Label');

      expect((result.series as { name: string; data: number[] }[])[0].name).toBe('Custom Label');
    });

    it('should handle empty data array', () => {
      const result = setToBarChart([], 'Empty');

      expect(result.xLabels).toEqual([]);
      expect((result.series as { name: string; data: number[] }[])[0].data).toEqual([]);
      expect((result.series as { name: string; data: number[] }[])[0].name).toBe('Empty');
    });
  });

  describe('setToLineChart', () => {
    it('should return a DataChart with type line', () => {
      const data: ItemSerie[] = [{ name: 'S1', data: [1, 2, 3] }];
      const labels = ['Jan', 'Feb', 'Mar'];
      const result = setToLineChart(data, labels);

      expect(result).toBeInstanceOf(DataChart);
      expect(result.type).toBe('line');
    });

    it('should use provided labels as xLabels', () => {
      const labels = ['Jan', 'Feb', 'Mar'];
      const result = setToLineChart([], labels);

      expect(result.xLabels).toEqual(['Jan', 'Feb', 'Mar']);
    });

    it('should pass data array as series', () => {
      const data: ItemSerie[] = [
        { name: 'Series 1', data: [10, 20] },
        { name: 'Series 2', data: [30, 40] },
      ];
      const result = setToLineChart(data, ['A', 'B']);

      expect(result.series).toEqual(data);
    });

    it('should handle empty data and labels', () => {
      const result = setToLineChart([], []);

      expect(result.xLabels).toEqual([]);
      expect(result.series).toEqual([]);
      expect(result.type).toBe('line');
    });
  });

  describe('setToPieChart', () => {
    it('should return a DataChart with type donut', () => {
      const data: ItemRead[] = [{ name: 'Cat1', count: 30 }];
      const result = setToPieChart(data);

      expect(result).toBeInstanceOf(DataChart);
      expect(result.type).toBe('donut');
    });

    it('should map item names to xLabels', () => {
      const data: ItemRead[] = [
        { name: 'Positive', count: 60 },
        { name: 'Negative', count: 40 },
      ];
      const result = setToPieChart(data);

      expect(result.xLabels).toEqual(['Positive', 'Negative']);
    });

    it('should map item counts to series as a number array', () => {
      const data: ItemRead[] = [
        { name: 'A', count: 10 },
        { name: 'B', count: 20 },
        { name: 'C', count: 30 },
      ];
      const result = setToPieChart(data);

      expect(result.series).toEqual([10, 20, 30]);
    });

    it('should handle empty data array', () => {
      const result = setToPieChart([]);

      expect(result.xLabels).toEqual([]);
      expect(result.series).toEqual([]);
      expect(result.type).toBe('donut');
    });
  });
});
