import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MinMaxDateRead } from '../models/items.model';
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

  constructor(private http: HttpClient) {
    this.isMobile$.next(this.checkIsMobile());
    this.initialize();
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

  private checkIsMobile(): boolean {
    const userAgent: string = navigator.userAgent;
    const isMobile: boolean =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    return isMobile;
  }
}
