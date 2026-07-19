import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import {
  GeneralMediaRead,
  GeneralMediaTable,
  SortTableEvent,
} from '../../../models/table.model';
import { Subject, debounceTime,  } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-general-table',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    TranslatePipe,
    ButtonModule,
    RippleModule,
    InputIcon,
    IconField,
    InputTextModule,
    Card,
    FloatLabel,
    MessageModule,
    Tooltip,
  ],
  templateUrl: './general-table.component.html',
})
export class GeneralTableComponent implements OnInit {
  readonly dataGeneralTable = input<GeneralMediaTable>();

  labelName!: string;
  labelType!: string;
  labelCountry!: string;
  labelRegion!: string;
  labelUrl!: string;
  labelTotalArticles!: string;
  labelAverageWordsArticle!: string;
  labelTopWords!: string;
  labelTopSentiments!: string;
  labelBottomSentiments!: string;
  labelTopIdeologies!: string;
  labelBottomIdeologies!: string;
  labelTopGrammar!: string;

  dataTable!: GeneralMediaRead[];
  dataTableLocked!: GeneralMediaRead[];

  select!: GeneralMediaRead;
  globalFilterValue = '';

  isMobile = false;

  private sortEvent$ = new Subject<SortTableEvent>();
  private staticDataTable!: GeneralMediaRead[];

  // TODO: Remake into a improved const in the constants.ts file, and remove duplicated constants from other files.
  private readonly TRANSLATABLE_FIELDS = {
    TYPE: 'type',
    REGION: 'region',
    COUNTRY: 'country',
    TYPE_PREFIX: 'types.',
    REGION_PREFIX: 'regions.',
    COUNTRY_PREFIX: 'countries.',
  };

  private generalSrv = inject(GeneralService);
  private translateSrv = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initValues();
    this.onTranslatableChanges();

    this.translateSrv.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.globalFilterValue = '';
        this.applyGlobalFilter();
      });
  }

  private initValues() {
    this.dataTableLocked = [];
    this.dataTable = [...(this.dataGeneralTable()?.data ?? [])];
    this.staticDataTable = this.dataTable;

    this.labelName = this.dataGeneralTable()?.labelName ?? '';
    this.labelType = this.dataGeneralTable()?.labelType ?? '';
    this.labelCountry = this.dataGeneralTable()?.labelCountry ?? '';
    this.labelRegion = this.dataGeneralTable()?.labelRegion ?? '';
    this.labelUrl = this.dataGeneralTable()?.labelUrl ?? '';
    this.labelTotalArticles = this.dataGeneralTable()?.labelTotalArticles ?? '';

    this.labelAverageWordsArticle =
      this.dataGeneralTable()?.labelAverageWordsArticle ?? '';
    this.labelTopWords = this.dataGeneralTable()?.labelTopWords ?? '';
    this.labelTopSentiments = this.dataGeneralTable()?.labelTopSentiments ?? '';

    this.labelBottomSentiments =
      this.dataGeneralTable()?.labelBottomSentiments ?? '';
    this.labelTopIdeologies = this.dataGeneralTable()?.labelTopIdeologies ?? '';
    this.labelBottomIdeologies =
      this.dataGeneralTable()?.labelBottomIdeologies ?? '';

    this.labelTopGrammar = this.labelTopGrammar =
      this.dataGeneralTable()?.labelTopGrammar ?? '';
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  onCustomSort(event: SortTableEvent): void {
    this.sortEvent$.next(event);
  }

  private onTranslatableChanges() {
    this.sortEvent$
      .pipe(
        debounceTime(0),
        switchMap((event) =>
          this.translateSrv.onLangChange.pipe(
            startWith(null),
            map(() => event),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const { field, order } = event;

        const isTranslatableField =
          field === this.TRANSLATABLE_FIELDS.TYPE ||
          field === this.TRANSLATABLE_FIELDS.REGION ||
          field === this.TRANSLATABLE_FIELDS.COUNTRY;

        if (isTranslatableField) {
          this.sortTranslatableField(field, order);
        } else {
          this.sortNotTranslatableField(field, order);
        }
      });
  }

  private sortTranslatableField(field: string, order: number): void {
    const prefix =
      field === this.TRANSLATABLE_FIELDS.TYPE
        ? this.TRANSLATABLE_FIELDS.TYPE_PREFIX
        : field === this.TRANSLATABLE_FIELDS.REGION
          ? this.TRANSLATABLE_FIELDS.REGION_PREFIX
          : this.TRANSLATABLE_FIELDS.COUNTRY_PREFIX;

    this.dataTable.sort((a, b) => {
      const valueA = this.translateSrv.instant(
        prefix + a[field as keyof GeneralMediaRead],
      );
      const valueB = this.translateSrv.instant(
        prefix + b[field as keyof GeneralMediaRead],
      );
      return order * valueA.localeCompare(valueB);
    });
  }

  private sortNotTranslatableField(field: string, order: number): void {
    this.dataTable.sort((a, b) => {
      const valueA = a[field as keyof GeneralMediaRead];
      const valueB = b[field as keyof GeneralMediaRead];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return order * (valueA - valueB);
      }
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order * valueA.localeCompare(valueB);
      }
      return 0;
    });
  }

  toggleLock(data: GeneralMediaRead, frozen: boolean): void {
    if (frozen) {
      const isLocked = !this.dataTableLocked.some(
        (item: GeneralMediaRead) => item.name === data.name,
      );

      if (isLocked && this.dataTableLocked.length < 3) {
        this.dataTableLocked = [...this.dataTableLocked, data];
      }
    } else {
      this.dataTableLocked = this.dataTableLocked.filter(
        (item: GeneralMediaRead) => item.name !== data.name,
      );
    }

    this.applyGlobalFilter();
  }

  applyGlobalFilter(): void {
    const filteredData = this.globalFilterValue
      ? this.getFilteredData(this.staticDataTable, this.globalFilterValue)
      : [...this.staticDataTable];

    this.dataTable = filteredData.filter(
      (item: GeneralMediaRead) =>
        !this.dataTableLocked.some(
          (lockedItem: GeneralMediaRead) => lockedItem.name === item.name,
        ),
    );
  }

  private getFilteredData(
    data: GeneralMediaRead[],
    value: string,
  ): GeneralMediaRead[] {
    const lowerCaseValue = value.toLowerCase();
    return data.filter((item: GeneralMediaRead) => {
      const translatedType = this.translateSrv
        .instant(this.TRANSLATABLE_FIELDS.TYPE_PREFIX + item.type)
        .toLowerCase();
      const translatedRegion = this.translateSrv
        .instant(this.TRANSLATABLE_FIELDS.REGION_PREFIX + item.region)
        .toLowerCase();
      const translatedCountry = this.translateSrv
        .instant(this.TRANSLATABLE_FIELDS.COUNTRY_PREFIX + item.country)
        .toLowerCase();

      return (
        item.name.toLowerCase().includes(lowerCaseValue) ||
        translatedType.includes(lowerCaseValue) ||
        translatedRegion.includes(lowerCaseValue) ||
        translatedCountry.includes(lowerCaseValue)
      );
    });
  }
}
