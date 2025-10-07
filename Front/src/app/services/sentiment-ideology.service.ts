import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CategoryValues, FilterChartsRead } from '../models/items.model';
import { IDEOLOGIES, SENTIMENTS } from '../utils/constants';
import { IDEOLOGIES_GROUPS, SENTIMENTS_GROUPS } from '../utils/groups-constant';
import {
  Ideologies,
  Sentiments,
  SentimentsIdeologiesRead,
} from '../models/sentiment-ideology.model';
import { SelectGroupItem2, SelectItem2 } from '../models/primeng.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SentimentIdeologyService {
  private readonly ideologiesSub = new BehaviorSubject<Ideologies>(
    new Ideologies()
  );
  public readonly ideologies$ = this.ideologiesSub.asObservable();

  private readonly sentimentsSub = new BehaviorSubject<Sentiments>(
    new Sentiments()
  );
  public readonly sentiments$ = this.sentimentsSub.asObservable();

  private apiUrl = environment.apiUrl + '/filters';

  constructor(private http: HttpClient, private trans: TranslateService) {
    this.initialize();
  }

  getTranslatedSentimentsIdeologies(): void {
    const sentiments: SelectGroupItem2[] = this.translateAndSortGroups(
      SENTIMENTS_GROUPS,
      SENTIMENTS
    );

    const ideologies: SelectGroupItem2[] = this.translateAndSortGroups(
      IDEOLOGIES_GROUPS,
      IDEOLOGIES
    );

    this.sentimentsSub.next({ sentiments });
    this.ideologiesSub.next({ ideologies });
  }

  async setFilterSentiment(
    filter: Record<string, string | number | string[] | null>
  ): Promise<FilterChartsRead> {
    return await firstValueFrom(
      this.http.post<FilterChartsRead>(
        `${this.apiUrl}/sentimentsfilter`,
        filter
      )
    );
  }

  async setFilterIdeology(
    filter: Record<string, string | number | string[] | null>
  ): Promise<FilterChartsRead> {
    return await firstValueFrom(
      this.http.post<FilterChartsRead>(
        `${this.apiUrl}/ideologiesfilter`,
        filter
      )
    );
  }

  private async initialize(): Promise<void> {
    await this.getSentimentsIdeologies();
  }

  private async getSentimentsIdeologies(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<SentimentsIdeologiesRead>(
        `${this.apiUrl}/sentimentsideologies`
      )
    );

    // Helper function to process groups and items
    const processGroups = (
      groups: SelectGroupItem2[],
      sourceCategories: CategoryValues[]
    ): void => {
      groups.forEach((group: SelectGroupItem2) => {
        const categoryData = sourceCategories.find(
          (cat: CategoryValues) => cat.category === group.label
        );
        if (categoryData) {
          group.items = categoryData.values.map(
            (value: string) => new SelectItem2(value)
          );
        } else {
          group.items = [];
        }
      });
    };

    // Process both groups with the same logic
    processGroups(SENTIMENTS_GROUPS, data.sentiments);
    processGroups(IDEOLOGIES_GROUPS, data.ideologies);

    this.getTranslatedSentimentsIdeologies();
  }

  private translateAndSortGroups(
    groups: SelectGroupItem2[],
    type: string
  ): SelectGroupItem2[] {
    return groups.map((group: SelectGroupItem2) => ({
      ...group, // Spread to keep other properties
      items: group.items
        .map((item: SelectItem2) => {
          item.updateTranslation(this.trans.instant(`${type}.${item.key}`));
          return { ...item };
        })
        .sort((a: SelectItem2, b: SelectItem2) =>
          a.label.localeCompare(b.label)
        ), // Sort the new array
    }));
  }
}
