import { BehaviorSubject, Subscription } from 'rxjs';
import {
  COUNT,
  DATE,
  IDEOLOGIES,
  NO_DATA,
  TO_API,
} from '../../../utils/constants';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FilterItem,
  SelectGroupItem2,
  SelectItem2,
} from '../../../models/primeng.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BarChartComponent } from '../../charts/bar-chart/bar-chart.component';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { DataChart } from '../../../models/chart.model';
import { FilterComponent } from '../filter/filter.component';
import { FiltersService } from '../../../services/filters.service';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { LineChartComponent } from '../../charts/line-chart/line-chart.component';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { NoData } from '../../../models/items.model';
import { NoDataComponent } from '../../no-data/no-data.component';
import { PieChartComponent } from '../../charts/pie-chart/pie-chart.component';
import { ToastModule } from 'primeng/toast';

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
export class FilterIdeologyComponent implements OnInit, OnDestroy {
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

  private subscriptions: Subscription[] = [];

  constructor(
    private filtersSrv: FiltersService,
    private messageService: MessageService,
    private trans: TranslateService,
    private generalSrv: GeneralService
  ) {}

  ngOnInit(): void {
    this.setIdeologies();
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.composeValues = [];
      this.pieChart = null;
      this.barChart = null;
      this.lineChart = null;
    });
    this.subscriptions.push(langChangeSub);
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  sendFiltersDialog(type: string) {
    this.generalSrv.filtersTypeDialog$.next(type);
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
      this.filtersSrv
        .setFilterIdeology(composeObj)
        .then((data) => {
          if (data.plain) {
            this.barChart = this.generalSrv.setToBarChart(data.plain, COUNT);
            this.barChart.translate = IDEOLOGIES;
          }
          if (data.categorized) {
            this.pieChart = this.generalSrv.setToPieChart(data.categorized);
            this.pieChart.translate = IDEOLOGIES;
          }
          if (data.date_chart) {
            this.lineChart = this.generalSrv.setToLineChart(
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
    const ideologiesSub = this.filtersSrv.ideologies$.subscribe((data) => {
      this.ideologies.data.set(data.ideologies);
      this.ideologies.value.set(null);
    });
    this.subscriptions.push(ideologiesSub);
  }
}
