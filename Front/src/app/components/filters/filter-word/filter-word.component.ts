import {
  ASCENDING,
  COUNT,
  DATE,
  DESCENDING,
  MAX_RANGE,
  MIN_RANGE,
  ORDER_BY_DESC,
  TO_API,
  WORD,
} from '../../../utils/constants';
import { BehaviorSubject, Subscription } from 'rxjs';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { DataCountTable } from '../../../models/table.model';
import { FilterComponent } from '../filter/filter.component';
import { FiltersService } from '../../../services/filters.service';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { NoData } from '../../../models/items.model';
import { NoDataComponent } from '../../no-data/no-data.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SortTableComponent } from '../../tables/sort-table/sort-table.component';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-filter-word',
  imports: [
    FormsModule,
    FilterComponent,
    MultiSelectModule,
    FloatLabel,
    TranslatePipe,
    ButtonModule,
    ToastModule,
    Card,
    RadioButtonModule,
    InputNumberModule,
    SortTableComponent,
    NoDataComponent,
  ],
  templateUrl: './filter-word.component.html',
  styleUrl: './filter-word.component.css',
  providers: [MessageService],
})
export class FilterWordComponent implements OnInit, OnDestroy {
  order = DESCENDING;

  noData: NoData = {
    isLoading: new BehaviorSubject<boolean>(false),
    type: 'no_data_filters',
  };

  minRange: number | null = null;
  maxRange = 200;

  dataWordsTable: DataCountTable | null = null;

  private readonly maxRangeCount = 200;

  private composeValues: {
    type: string;
    key: string | number | string[] | null;
  }[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private filtersSrv: FiltersService,
    private messageService: MessageService,
    private trans: TranslateService,
    @Inject(LOCALE_ID) public LOCALE_ID: string
  ) {}

  ngOnInit(): void {
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.composeValues = [];
    });
    this.subscriptions.push(langChangeSub);
  }

  getComposeValues(
    e: { type: string; key: string | number | string[] | null }[]
  ) {
    this.composeValues = e;
  }

  showWarn(msg = '') {
    this.messageService.clear();
    this.messageService.add({
      severity: 'warn',
      summary: this.trans.instant('messages.warning'),
      detail: this.trans.instant('messages.' + msg),
      life: 5000,
      closable: true,
    });
  }

  onClickFilter() {
    // Check for invalid range combinations
    if (this.minRange !== null && this.maxRange !== null) {
      if (this.minRange >= this.maxRange) {
        this.showWarn('min_max_range');
        return;
      }
      if (this.maxRange - this.minRange > this.maxRangeCount) {
        this.showWarn('range_too_large');
        return;
      }
    } else if (this.minRange === null && this.maxRange > this.maxRangeCount) {
      this.showWarn('range_too_large');
      return;
    }

    if (
      this.composeValues.length == 0 ||
      !this.composeValues.some((item) => item.type !== DATE)
    ) {
      this.showWarn('empty_filters');
      return;
    } else {
      this.noData.isLoading?.next(true);
      const composeObj: Record<
        string,
        string | number | string[] | boolean | null
      > = {};
      this.composeValues.forEach((item) => {
        if (item.type in TO_API) {
          composeObj[TO_API[item.type as keyof typeof TO_API]] = item.key;
        }
      });
      if (this.minRange !== null) {
        composeObj[MIN_RANGE] = this.minRange;
      }
      if (this.maxRange !== null) {
        composeObj[MAX_RANGE] = this.maxRange;
      }
      if (this.order === ASCENDING) {
        composeObj[ORDER_BY_DESC] = false;
      }
      this.dataWordsTable = null;
      this.filtersSrv
        .setFilterWord(composeObj)
        .then((data) => {
          const sortOrder = this.order === DESCENDING ? -1 : 1;
          this.dataWordsTable = new DataCountTable(
            data,
            WORD,
            COUNT,
            sortOrder
          );
        })
        .finally(() => {
          this.noData.isLoading?.next(false);
        });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
