import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { ItemRead, ItemSerie, MinMaxDateRead } from '../models/items.model';
import { DataChart } from '../models/chart.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class GeneralService {
  public readonly isMobile$ = new BehaviorSubject<boolean>(false);

  private readonly minMaxDateSub = new BehaviorSubject<MinMaxDateRead>(
    new MinMaxDateRead()
  );
  public readonly minMaxDate$ = this.minMaxDateSub.asObservable();

  constructor(
    private http: HttpClient
  ) {
    this.isMobile$.next(this.checkIfMobile());
    this.initialize();
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
    return new DataChart(labels, data, 'line');
  }

  setToPieChart(data: ItemRead[]): DataChart {
    const labels = data.map((item) => item.name);
    const series = data.map((item) => item.count);
    return new DataChart(labels, series, 'donut');
  }

  private async initialize(): Promise<void> {
    await this.getMinMaxDates();
  }

  private async getMinMaxDates(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<MinMaxDateRead>(`${environment.apiUrl}/filters/minmaxdate`)
    );
    this.minMaxDateSub.next(data);
  }

  private checkIfMobile(): boolean {
    const userAgent = navigator.userAgent;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    return isMobile;
  }
}
