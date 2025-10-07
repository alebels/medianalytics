import { ChartDialog, FilterDialog } from '../../models/dialog.model';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CompoundDataCharts, DataChart } from '../../models/chart.model';
import { DataCountTable, GeneralMediaTable } from '../../models/table.model';
import { IDEOLOGIES, MEDIAS, NO_DATA, SENTIMENTS } from '../../utils/constants';
import { Ideologies, Sentiments } from '../../models/sentiment-ideology.model';
import { MinMaxDateRead, NoData } from '../../models/items.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  dataChartDialog$,
  isShowChartDialog$,
  isShowFiltersDialog$,
} from '../../utils/dialog-subjects';
import { BarChartComponent } from '../../components/charts/bar-chart/bar-chart.component';
import { Card } from 'primeng/card';
import { ChartDialogComponent } from '../../components/dialogs/chart-dialog/chart-dialog.component';
import { CommonModule } from '@angular/common';
import { FiltersDialogComponent } from '../../components/dialogs/filters-dialog/filters-dialog.component';
import { GeneralMedia } from '../../models/media.model';
import { GeneralService } from '../../services/general.service';
import { GeneralTableComponent } from '../../components/tables/general-table/general-table.component';
import { HomeService } from '../../services/home.service';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { Observable } from 'rxjs';
import { PieChartComponent } from '../../components/charts/pie-chart/pie-chart.component';
import { SentimentIdeologyService } from '../../services/sentiment-ideology.service';
import { SortTableComponent } from '../../components/tables/sort-table/sort-table.component';
import { Tooltip } from 'primeng/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    TranslatePipe,
    BarChartComponent,
    SortTableComponent,
    Card,
    PieChartComponent,
    GeneralTableComponent,
    NoDataComponent,
    Tooltip,
    FiltersDialogComponent,
    ChartDialogComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  noData: NoData = {
    type: NO_DATA.LOADING_HOME,
  };

  generalTotalMedias = 0;
  generalTotalArticles!: Observable<number>;
  generalAverageWords!: Observable<number>;
  generalTotalWords!: Observable<number>;

  minDate: Date | null = null;
  maxDate: Date | null = null;

  generalDayTopWords!: DataChart;
  generalDaySentiments!: CompoundDataCharts;
  generalDayIdeologies!: CompoundDataCharts;

  generalTopWords!: DataChart;
  generalBottomWords!: DataCountTable;

  generalSentiments!: CompoundDataCharts;
  generalIdeologies!: CompoundDataCharts;

  generalTopGrammar!: DataChart;
  generalTable!: GeneralMediaTable;

  currentLang!: string;
  isMobile = false;

  dataFiltersDialog = new FilterDialog([], []);
  isShowFiltersDialog = signal(false);

  isShowChartDialog = signal(false);
  dataChartDialog = signal(new ChartDialog());

  readonly GENERAL_MEDIAS = MEDIAS;
  readonly SENTIMENTS = SENTIMENTS;
  readonly IDEOLOGIES = IDEOLOGIES;

  private homeSrv = inject(HomeService);
  private generalSrv = inject(GeneralService);
  private trans = inject(TranslateService);
  private sentimentIdeologySrv = inject(SentimentIdeologyService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.generalTotalArticles = this.homeSrv.generalTotalArticles$;
    this.generalAverageWords = this.homeSrv.generalAverageWord$;
    this.generalTotalWords = this.homeSrv.generalTotalWords$;
    this.isMobile = this.generalSrv.isMobile$.getValue();

    this.setGeneralTable();
    this.setGeneralDayTopWords();
    this.setGeneralDaySentiments();
    this.setGeneralDayIdeologies();
    this.getMinMaxDate();
    this.setGeneralMedias();
    this.setGeneralIdeologies();
    this.setGeneralSentiments();
    this.setGeneralTopWords();
    this.setGeneralBottomWords();
    this.setGeneralTopGrammar();
    this.initializeDialogs();
  }

  showFiltersDialog(type: string): void {
    this.isShowChartDialog.set(false);

    if (type === this.dataFiltersDialog?.header()) {
      // Same type clicked - toggle visibility
      this.isShowFiltersDialog.set(!this.isShowFiltersDialog());
    } else {
      // Different type - set new type and show dialog
      this.dataFiltersDialog.header.set(type);
      this.isShowFiltersDialog.set(true);
    }
  }

  private initializeDialogs(): void {
    this.setFiltersDialog();

    // Subscribe to dialog visibility changes
    isShowFiltersDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: boolean) => {
        this.isShowFiltersDialog.set(data);
        this.isShowChartDialog.set(false);
      });

    isShowChartDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: boolean) => {
        this.isShowChartDialog.set(data);
        this.isShowFiltersDialog.set(false);
      });

    dataChartDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: ChartDialog) => {
        this.dataChartDialog.set(data);
      });
  }

  private setFiltersDialog(): void {
    this.sentimentIdeologySrv.sentiments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sentimentData: Sentiments) => {
        this.dataFiltersDialog.sentiments = sentimentData.sentiments;
      });

    this.sentimentIdeologySrv.ideologies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ideologyData: Ideologies) => {
        this.dataFiltersDialog.ideologies = ideologyData.ideologies;
      });
  }

  private setGeneralMedias(): void {
    this.homeSrv.generalMedias$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: GeneralMedia[]) => {
        this.generalTotalMedias = data.length ? data.length : 0;
        this.dataFiltersDialog.generalMedias = data;
      });
  }

  private setGeneralDayTopWords(): void {
    this.homeSrv.generalDayTopWords$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: DataChart) => {
        this.generalDayTopWords = data;
      });
  }

  private setGeneralDaySentiments(): void {
    this.homeSrv.generalDaySentiments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: CompoundDataCharts) => {
        this.generalDaySentiments = data;
        // this.generalDaySentiments.plain.filterDialogChart = new FilterDialogChart(undefined, undefined, undefined, undefined, undefined, undefined, true);
      });
  }

  private setGeneralDayIdeologies(): void {
    this.homeSrv.generalDayIdeologies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: CompoundDataCharts) => {
        this.generalDayIdeologies = data;
      });
  }

  private getMinMaxDate(): void {
    this.generalSrv.minMaxDate$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: MinMaxDateRead) => {
        if (data) {
          const minDateParsed = new Date(data.min_date);
          const maxDateParsed = new Date(data.max_date);

          this.minDate = isNaN(minDateParsed.getTime()) ? null : minDateParsed;
          this.maxDate = isNaN(maxDateParsed.getTime()) ? null : maxDateParsed;

          this.currentLang = this.trans.currentLang || 'en';
          this.trans.onLangChange
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((lang) => {
              this.currentLang = lang.lang;
            });
        }
      });
  }

  // private setGeneralChartDataFilter(minDate: Date, maxDate: Date): void {
  //   this.generalDaySentiments.plain.filterDialogChart = new ChartDialog();
  //   this.generalDaySentiments.plain.filterDialogChart.rangeDates = [maxDate];
  // }

  private setGeneralTopWords(): void {
    this.homeSrv.generalTopWords$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: DataChart) => {
        this.generalTopWords = data;
      });
  }

  private setGeneralBottomWords(): void {
    this.homeSrv.generalBottomWords$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: DataCountTable) => {
        this.generalBottomWords = data;
      });
  }

  private setGeneralSentiments(): void {
    this.homeSrv.generalSentiments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: CompoundDataCharts) => {
        this.generalSentiments = data;
      });
  }

  private setGeneralIdeologies(): void {
    this.homeSrv.generalIdeologies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: CompoundDataCharts) => {
        this.generalIdeologies = data;
      });
  }

  private setGeneralTopGrammar(): void {
    this.homeSrv.generalTopGrammar$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: DataChart) => {
        this.generalTopGrammar = data;
      });
  }

  private setGeneralTable(): void {
    this.homeSrv.generalTableSub$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: GeneralMediaTable) => {
        this.generalTable = data;
      });
  }
}
