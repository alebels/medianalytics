import { Component, OnDestroy, OnInit } from '@angular/core';
import { CompoundDataCharts, DataChart } from '../../models/chart.model';
import { DataCountTable, GeneralMediaTable } from '../../models/table.model';
import { IDEOLOGIES, MEDIAS, NO_DATA, SENTIMENTS } from '../../utils/constants';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BarChartComponent } from '../../components/charts/bar-chart/bar-chart.component';
import { Card } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FilterDialog } from '../../models/dialog.model';
import { FiltersDialogComponent } from '../../components/dialogs/filters-dialog/filters-dialog.component';
import { GeneralService } from '../../services/general.service';
import { GeneralTableComponent } from '../../components/tables/general-table/general-table.component';
import { HomeService } from '../../services/home.service';
import { NoData } from '../../models/items.model';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { PieChartComponent } from '../../components/charts/pie-chart/pie-chart.component';
import { SentimentIdeologyService } from '../../services/sentiment-ideology.service';
import { SortTableComponent } from '../../components/tables/sort-table/sort-table.component';
import { Subscription } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';

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
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  noData: NoData = {
    type: NO_DATA.LOADING_HOME,
  };

  generalTotalMedias = 0;
  generalTotalArticles = 0;
  generalAverageWords = 0;
  generalTotalWords = 0;

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
  isShowFiltersDialog = false;

  readonly GENERAL_MEDIAS = MEDIAS;
  readonly SENTIMENTS = SENTIMENTS;
  readonly IDEOLOGIES = IDEOLOGIES;

  private subscriptions: Subscription[] = [];

  constructor(
    private homeSrv: HomeService,
    private generalSrv: GeneralService,
    private trans: TranslateService,
    private sentimentIdeologySrv: SentimentIdeologyService
  ) {}

  ngOnInit(): void {
    this.getMinMaxDate();
    this.initializeDialogs();
    this.setGeneralDayTopWords();
    this.setGeneralDaySentiments();
    this.setGeneralDayIdeologies();
    this.setGeneralTable();
    this.setGeneralMedias();
    this.setGeneralTotalArticles();
    this.setGeneralAverageWords();
    this.setGeneralTotalWords();
    this.setGeneralIdeologies();
    this.setGeneralSentiments();
    this.setGeneralTopWords();
    this.setGeneralBottomWords();
    this.setGeneralTopGrammar();
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  showFiltersDialog(type: string) {
    if (type === this.dataFiltersDialog?.header()) {
      // Same type clicked - toggle visibility
      this.isShowFiltersDialog = !this.isShowFiltersDialog;
    } else {
      // Different type - set new type and show dialog
      this.dataFiltersDialog.header.set(type);
      this.isShowFiltersDialog = true;
    }
  }

  private initializeDialogs(): void {
    this.setFiltersDialog();
    // Subscribe to dialog visibility changes
    const isShowDialogSub = this.generalSrv.isShowFiltersDialog$.subscribe(
      (data) => {
        this.isShowFiltersDialog = data;
      }
    );
    this.subscriptions.push(isShowDialogSub);
  }

  private setFiltersDialog(): void {
    const sentimentDataSub = this.sentimentIdeologySrv.sentiments$.subscribe(
      (sentimentData) => {
        this.dataFiltersDialog.sentiments = sentimentData.sentiments;
      }
    );
    this.subscriptions.push(sentimentDataSub);
    const ideologiesDataSub = this.sentimentIdeologySrv.ideologies$.subscribe(
      (ideologyData) => {
        this.dataFiltersDialog.ideologies = ideologyData.ideologies;
      }
    );
    this.subscriptions.push(ideologiesDataSub);
  }

  private setGeneralMedias(): void {
    const mediasSub = this.homeSrv.generalMedias$.subscribe((data) => {
      this.generalTotalMedias = data.length ? data.length : 0;
      this.dataFiltersDialog.generalMedias = data;
    });
    this.subscriptions.push(mediasSub);
  }

  private setGeneralTotalArticles(): void {
    const totalArticlesSub = this.homeSrv.generalTotalArticles$.subscribe(
      (data) => {
        this.generalTotalArticles = data;
      }
    );
    this.subscriptions.push(totalArticlesSub);
  }

  private setGeneralTotalWords(): void {
    const totalWordsSub = this.homeSrv.generalTotalWords$.subscribe((data) => {
      this.generalTotalWords = data;
    });
    this.subscriptions.push(totalWordsSub);
  }

  private setGeneralDayTopWords(): void {
    const dayTopWordsSub = this.homeSrv.generalDayTopWords$.subscribe(
      (data) => {
        this.generalDayTopWords = data;
      }
    );
    this.subscriptions.push(dayTopWordsSub);
  }

  private setGeneralDaySentiments(): void {
    const daySentimentsSub = this.homeSrv.generalDaySentiments$.subscribe(
      (data) => {
        this.generalDaySentiments = data;
      }
    );
    this.subscriptions.push(daySentimentsSub);
  }

  private setGeneralDayIdeologies(): void {
    const dayIdeologiesSub = this.homeSrv.generalDayIdeologies$.subscribe(
      (data) => {
        this.generalDayIdeologies = data;
      }
    );
    this.subscriptions.push(dayIdeologiesSub);
  }

  private getMinMaxDate(): void {
    const minMaxDateSub = this.generalSrv.minMaxDate$.subscribe((data) => {
      if (data) {
        const minDateParsed = new Date(data.min_date);
        const maxDateParsed = new Date(data.max_date);

        this.minDate = isNaN(minDateParsed.getTime()) ? null : minDateParsed;
        this.maxDate = isNaN(maxDateParsed.getTime()) ? null : maxDateParsed;

        this.currentLang = this.trans.currentLang || 'en';
        const langChangeSub = this.trans.onLangChange.subscribe((lang) => {
          this.currentLang = lang.lang;
        });
        this.subscriptions.push(langChangeSub);
      }
    });
    this.subscriptions.push(minMaxDateSub);
  }

  private setGeneralTopWords(): void {
    const top30GeneralWordsSub = this.homeSrv.generalTopWords$.subscribe(
      (data) => {
        this.generalTopWords = data;
      }
    );
    this.subscriptions.push(top30GeneralWordsSub);
  }

  private setGeneralBottomWords(): void {
    const bottom30GeneralWordsSub = this.homeSrv.generalBottomWords$.subscribe(
      (data) => {
        this.generalBottomWords = data;
      }
    );
    this.subscriptions.push(bottom30GeneralWordsSub);
  }

  private setGeneralAverageWords(): void {
    const averageWordsSub = this.homeSrv.generalAverageWord$.subscribe(
      (data) => {
        this.generalAverageWords = data;
      }
    );
    this.subscriptions.push(averageWordsSub);
  }

  private setGeneralSentiments(): void {
    const topSentimentsSub = this.homeSrv.generalSentiments$.subscribe(
      (data) => {
        this.generalSentiments = data;
      }
    );
    this.subscriptions.push(topSentimentsSub);
  }

  private setGeneralIdeologies(): void {
    const topIdeologiesSub = this.homeSrv.generalIdeologies$.subscribe(
      (data) => {
        this.generalIdeologies = data;
      }
    );
    this.subscriptions.push(topIdeologiesSub);
  }

  private setGeneralTopGrammar(): void {
    const topGrammarSub = this.homeSrv.generalTopGrammar$.subscribe((data) => {
      this.generalTopGrammar = data;
    });
    this.subscriptions.push(topGrammarSub);
  }

  private setGeneralTable(): void {
    const generalTableSub = this.homeSrv.generalTableSub$.subscribe((data) => {
      this.generalTable = data;
    });
    this.subscriptions.push(generalTableSub);
  }
}
