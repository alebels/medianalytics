import {
  COUNT,
  DATE,
  NO_DATA,
  SORTING,
  TO_API,
  WORD,
} from '../../../utils/constants';
import {
  Component,
  DestroyRef,
  LOCALE_ID,
  OnInit,
  inject,
} from '@angular/core';
import { ItemRead, NoData } from '../../../models/items.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
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
import { NoDataComponent } from '../../no-data/no-data.component';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SortTableComponent } from '../../tables/sort-table/sort-table.component';
import { ToastModule } from 'primeng/toast';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
export class FilterWordComponent implements OnInit {
  order: string = SORTING.DESCENDING;

  noData: NoData = {
    isLoading: new BehaviorSubject<boolean>(false),
    type: NO_DATA.NO_DATA_FILTERS,
  };

  minRange: number | null = null;
  maxRange = 400;

  dataWordsTable: DataCountTable | null = null;

  LOCALE_ID = inject(LOCALE_ID);

  private readonly maxRangeCount = 400;

  private composeValues: {
    type: string;
    key: string | number | string[] | null;
  }[] = [];

  private filtersSrv = inject(FiltersService);
  private messageService = inject(MessageService);
  private trans = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.composeValues = [];
        this.dataWordsTable = null;
      });
  }

  getComposeValues(
    e: { type: string; key: string | number | string[] | null }[]
  ): void {
    this.composeValues = e;
  }

  showWarn(msg = ''): void {
    this.messageService.clear();
    this.messageService.add({
      severity: 'warn',
      summary: this.trans.instant('messages.warning'),
      detail: this.trans.instant('messages.' + msg),
      life: 5000,
      closable: true,
    });
  }

  onClickFilter(): void {
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
        composeObj[SORTING.MIN_RANGE] = this.minRange;
      }

      if (this.maxRange !== null) {
        composeObj[SORTING.MAX_RANGE] = this.maxRange;
      }

      if (this.order === SORTING.ASCENDING) {
        composeObj[SORTING.ORDER_BY_DESC] = false;
      }

      this.dataWordsTable = null;

      this.filtersSrv
        .setFilterWord(composeObj)
        .then((data: ItemRead[]) => {
          const sortOrder = this.order === SORTING.DESCENDING ? -1 : 1;
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
}
