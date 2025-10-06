import {
  COUNT,
  DATE,
  IDEOLOGIES,
  NO_DATA,
  TO_API,
} from '../../../utils/constants';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import {
  FilterItem,
  SelectGroupItem2,
  SelectItem2,
} from '../../../models/primeng.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  setToBarChart,
  setToLineChart,
  setToPieChart,
} from '../../../utils/set-chart';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart.component';
import { BehaviorSubject } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { DataChart } from '../../../models/chart.model';
import { FilterComponent } from '../filter/filter.component';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { NoData } from '../../../models/items.model';
import { NoDataComponent } from '../../no-data/no-data.component';
import { PieChartComponent } from '../../charts/pie-chart/pie-chart.component';
import { SentimentIdeologyService } from '../../../services/sentiment-ideology.service';
import { ToastModule } from 'primeng/toast';
import { filtersTypeDialog$ } from '../../../utils/dialog-subjects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-filter-ideology',
  imports: [
    FormsModule,
    FilterComponent,
    MultiSelectModule,
    FloatLabel,
    TranslatePipe,
    ButtonModule,
    ToastModule,
    BarChartComponent,
    Card,
    PieChartComponent,
    LineChartComponent,
    NoDataComponent,
  ],
  templateUrl: './filter-ideology.component.html',
  styleUrl: './filter-ideology.component.css',
  providers: [MessageService],
})
export class FilterIdeologyComponent implements OnInit {
  selectionLimit = 5;

  noData: NoData = {
    isLoading: new BehaviorSubject<boolean>(false),
    type: NO_DATA.NO_DATA_FILTERS,
  };

  ideologies: FilterItem = {
    type: IDEOLOGIES,
    data: signal<SelectGroupItem2[]>([]),
    value: signal<SelectItem2[]>([]),
  };

  pieChart: DataChart | null = null;
  barChart: DataChart | null = null;
  lineChart: DataChart | null = null;

  isMobile = false;

  private composeValues: {
    type: string;
    key: string | number | string[] | null;
  }[] = [];

  private sentimentIdeologySrv = inject(SentimentIdeologyService);
  private messageService = inject(MessageService);
  private trans = inject(TranslateService);
  private generalSrv = inject(GeneralService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.setIdeologies();
    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.composeValues = [];
        this.pieChart = null;
        this.barChart = null;
        this.lineChart = null;
      });
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  sendFiltersDialog(type: string) {
    filtersTypeDialog$.next(type);
  }

  getComposeValues(
    e: { type: string; key: string | number | string[] | null }[]
  ) {
    this.composeValues = e;
  }

  showWarn() {
    this.messageService.clear();
    this.messageService.add({
      severity: 'warn',
      summary: this.trans.instant('messages.warning'),
      detail: this.trans.instant('messages.empty_filters'),
      life: 8000,
      closable: true,
    });
  }

  onClickFilter() {
    if (
      this.composeValues.length == 0 ||
      !this.composeValues.some((item) => item.type !== DATE)
    ) {
      this.showWarn();
      return;
    } else {
      this.noData.isLoading?.next(true);
      const composeObj: Record<string, string | number | string[] | null> = {};
      this.composeValues.forEach((item) => {
        if (item.type in TO_API) {
          composeObj[TO_API[item.type as keyof typeof TO_API]] = item.key;
        }
      });
      if (this.ideologies.value()) {
        composeObj[IDEOLOGIES] = this.ideologies
          .value()
          .map((item: SelectItem2) => item.key);
      }
      this.barChart = null;
      this.pieChart = null;
      this.lineChart = null;
      this.sentimentIdeologySrv
        .setFilterIdeology(composeObj)
        .then((data) => {
          if (data.plain) {
            this.barChart = setToBarChart(data.plain, COUNT);
            this.barChart.translate = IDEOLOGIES;
          }
          if (data.categorized) {
            this.pieChart = setToPieChart(data.categorized);
            this.pieChart.translate = IDEOLOGIES;
          }
          if (data.date_chart) {
            this.lineChart = setToLineChart(
              data.date_chart.items,
              data.date_chart.labels
            );
            this.lineChart.translate = IDEOLOGIES;
          }
        })
        .finally(() => {
          this.noData.isLoading?.next(false);
        });
    }
  }

  private setIdeologies(): void {
    this.sentimentIdeologySrv.ideologies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        this.ideologies.data.set(data.ideologies);
        this.ideologies.value.set(null);
      });
  }
}
