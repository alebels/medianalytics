import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  COUNT,
  GRAMMAR,
  IDEOLOGIES,
  SENTIMENTS,
  WORD,
} from '../utils/constants';
import { CompoundDataCharts, DataChart } from '../models/chart.model';
import { CompoundRead, ItemRead } from '../models/items.model';
import {
  DataCountTable,
  GeneralMediaRead,
  GeneralMediaTable,
} from '../models/table.model';
import { GeneralService } from './general.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class HomeService {

  private readonly generalTotalMediasSub = new BehaviorSubject<number>(0);
  public readonly generalTotalMedias$ =
    this.generalTotalMediasSub.asObservable();
  
  private readonly generalTotalArticlesSub = new BehaviorSubject<number>(0);
  public readonly generalTotalArticles$ =
    this.generalTotalArticlesSub.asObservable();

  private readonly generalTotalWordsSub = new BehaviorSubject<number>(0);
  public readonly generalTotalWords$ = this.generalTotalWordsSub.asObservable();

  private readonly generalAverageWordSub = new BehaviorSubject<number>(0);
  public readonly generalAverageWord$ =
    this.generalAverageWordSub.asObservable();

  private readonly generalTopWordsSub = new BehaviorSubject<DataChart>(
    new DataChart()
  );
  public readonly generalTopWords$ = this.generalTopWordsSub.asObservable();

  private readonly generalBottomWordsSub = new BehaviorSubject<DataCountTable>(
    new DataCountTable()
  );
  public readonly generalBottomWords$ =
    this.generalBottomWordsSub.asObservable();

  private readonly generalSentimentsSub =
    new BehaviorSubject<CompoundDataCharts>(new CompoundDataCharts());
  public readonly generalSentiments$ = this.generalSentimentsSub.asObservable();

  private readonly generalIdeologiesSub =
    new BehaviorSubject<CompoundDataCharts>(new CompoundDataCharts());
  public readonly generalIdeologies$ = this.generalIdeologiesSub.asObservable();

  private readonly generalTopGrammarSub = new BehaviorSubject<DataChart>(
    new DataChart()
  );
  public readonly generalTopGrammar$ = this.generalTopGrammarSub.asObservable();

  private readonly generalTableSub = new BehaviorSubject<GeneralMediaTable>(
    new GeneralMediaTable()
  );
  public readonly generalTableSub$ = this.generalTableSub.asObservable();

  private apiUrl = environment.apiUrl + '/home';

  constructor(private http: HttpClient, private generalSrv: GeneralService) {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.getGeneralTotalMedias(),
      this.getGeneralTotalArticles(),
      this.getGeneralTopWords(),
      this.getGeneralBottomWords(),
      this.getGeneralAverageWordCount(),
      this.getGeneralSentiments(),
      this.getGeneralIdeologies(),
      this.getGeneralTopGrammar(),
      this.getGeneralTotalWords(),
      this.getGeneralTable(),
    ]);
  }

  private async getGeneralTotalMedias(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<number>(`${this.apiUrl}/generaltotalmedias`)
    );
    this.generalTotalMediasSub.next(data);
  }

  private async getGeneralTotalArticles(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<number>(`${this.apiUrl}/generaltotalarticles`)
    );
    this.generalTotalArticlesSub.next(data);
  }

  private async getGeneralTotalWords(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<number>(`${this.apiUrl}/generaltotalwords`)
    );
    this.generalTotalWordsSub.next(data);
  }

  private async getGeneralTopWords(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ItemRead[]>(`${this.apiUrl}/generaltopwords`)
    );
    const sendData: DataChart = this.generalSrv.setToBarChart(data, COUNT);
    this.generalTopWordsSub.next(sendData);
  }

  private async getGeneralBottomWords(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ItemRead[]>(`${this.apiUrl}/generalbottomwords`)
    );
    const sendData = new DataCountTable(data, WORD, COUNT);
    this.generalBottomWordsSub.next(sendData);
  }

  private async getGeneralAverageWordCount(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<number>(`${this.apiUrl}/generalaveragewordcount`)
    );
    this.generalAverageWordSub.next(data);
  }

  private async getGeneralSentiments(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<CompoundRead>(`${this.apiUrl}/generalsentiments`)
    );
    const sendData: CompoundDataCharts = new CompoundDataCharts(
      this.generalSrv.setToBarChart(data.plain, COUNT),
      this.generalSrv.setToPieChart(data.categorized)
    );
    sendData.plain.translate = SENTIMENTS;
    sendData.categorized.translate = SENTIMENTS;
    this.generalSentimentsSub.next(sendData);
  }

  private async getGeneralIdeologies(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<CompoundRead>(`${this.apiUrl}/generalideologies`)
    );
    const sendData: CompoundDataCharts = new CompoundDataCharts(
      this.generalSrv.setToBarChart(data.plain, COUNT),
      this.generalSrv.setToPieChart(data.categorized)
    );
    sendData.plain.translate = IDEOLOGIES;
    sendData.categorized.translate = IDEOLOGIES;
    this.generalIdeologiesSub.next(sendData);
  }

  private async getGeneralTopGrammar(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<ItemRead[]>(`${this.apiUrl}/generaltopgrammar`)
    );
    const sendData: DataChart = this.generalSrv.setToPieChart(data);
    sendData.translate = GRAMMAR;
    this.generalTopGrammarSub.next(sendData);
  }

  private async getGeneralTable(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<GeneralMediaRead[]>(`${this.apiUrl}/generaltable`)
    );
    const sendData: GeneralMediaTable = new GeneralMediaTable(
      data,
      'name',
      'type',
      'country',
      'region',
      'url',
      'total_articles',
      'average_words_article',
      'top_words',
      'top_sentiments',
      'bottom_sentiments',
      'top_ideologies',
      'bottom_ideologies',
      'top_grammar'
    );
    this.generalTableSub.next(sendData);
  }
}
