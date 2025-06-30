// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Component, Inject, LOCALE_ID, OnDestroy, OnInit } from '@angular/core';
import { CompoundDataCharts, DataChart } from '../../models/chart.model';
import { DataCountTable, GeneralMediaTable } from '../../models/table.model';
import { BarChartComponent } from '../../components/charts/bar-chart/bar-chart.component';
import { Card } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { GeneralService } from '../../services/general.service';
import { GeneralTableComponent } from '../../components/tables/general-table/general-table.component';
import { HomeService } from '../../services/home.service';
import { NoData } from '../../models/items.model';
import { NoDataComponent } from '../../components/no-data/no-data.component';
import { PieChartComponent } from '../../components/charts/pie-chart/pie-chart.component';
import { SortTableComponent } from '../../components/tables/sort-table/sort-table.component';
import { Subscription } from 'rxjs';
import { Tooltip } from 'primeng/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

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
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  noData: NoData = {
    type: 'loading_data_home',
  };

  generalTotalMedias = 0;
  generalTotalArticles = 0;
  generalAverageWords = 0;
  generalTotalWords = 0;

  minDate!: string;
  maxDate!: string;

  generalDayTopWords!: DataChart;
  generalDaySentiments!: CompoundDataCharts;
  generalDayIdeologies!: CompoundDataCharts;

  generalTopWords!: DataChart;
  generalBottomWords!: DataCountTable;

  generalSentiments!: CompoundDataCharts;
  generalIdeologies!: CompoundDataCharts;

  generalTopGrammar!: DataChart;

  generalTable!: GeneralMediaTable;

  isMobile = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private homeSrv: HomeService,
    private generalSrv: GeneralService,
    @Inject(LOCALE_ID) public LOCALE_ID: string
  ) {}

  ngOnInit(): void {
    this.getMinMaxDate();
    this.setGeneralDayTopWords();
    this.setGeneralDaySentiments();
    this.setGeneralDayIdeologies();
    this.setGeneralTable();
    this.setGeneralTotalMedias();
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

  private setGeneralTotalMedias(): void {
    const totalMediasSub = this.homeSrv.generalTotalMedias$.subscribe(
      (data) => {
        this.generalTotalMedias = data;
      }
    );
    this.subscriptions.push(totalMediasSub);
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
        this.minDate = new Date(data.min_date).toLocaleDateString(this.LOCALE_ID || 'en', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        this.maxDate = new Date(data.max_date).toLocaleDateString(this.LOCALE_ID || 'en', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
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
