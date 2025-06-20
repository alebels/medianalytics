import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { ItemRead, ItemSerie } from '../models/items.model';
import { BehaviorSubject } from 'rxjs';
import { DataChart } from '../models/chart.model';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  public readonly isMobile$ = new BehaviorSubject<boolean>(false);

  constructor(@Inject(LOCALE_ID) private localeId: string) {
    this.isMobile$.next(this.checkIfMobile());
  }

  setToBarChart(data: ItemRead[], label: string): DataChart {
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

  setToLineChart(data: ItemSerie[], labels: string[]): DataChart {
    const xlabels = labels.map((item) => {
      const date = new Date(item);
      return date.toLocaleDateString(this.localeId, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
    });
    return new DataChart(xlabels, data, 'line');
  }

  setToPieChart(data: ItemRead[]): DataChart {
    const labels = data.map((item) => item.name);
    const series = data.map((item) => item.count);
    return new DataChart(labels, series, 'donut');
  }

  private checkIfMobile(): boolean {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    console.log('Is mobile:', isMobile);
    return isMobile;
  }
}
