import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { CategoryValues, FilterChartsRead } from '../models/items.model';
import { IDEOLOGIES, SENTIMENTS } from '../utils/constants';
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
    new Ideologies(),
  );
  public readonly ideologies$ = this.ideologiesSub.asObservable();

  private readonly sentimentsSub = new BehaviorSubject<Sentiments>(
    new Sentiments(),
  );
  public readonly sentiments$ = this.sentimentsSub.asObservable();

  private rawSentiments: SelectGroupItem2[] = [];
  private rawIdeologies: SelectGroupItem2[] = [];

  private readonly sentimentColorMap = new Map<string, string>();
  private readonly ideologyColorMap = new Map<string, string>();
  private readonly sentimentCategoryColorMap = new Map<string, string>();
  private readonly ideologyCategoryColorMap = new Map<string, string>();

  private apiUrl = environment.apiUrl + '/filters';

  private loadPromise: Promise<void> | null = null;

  constructor(
    private http: HttpClient,
    private trans: TranslateService,
  ) {
    this.ensureLoaded();
  }

  ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.getSentimentsIdeologies();
    }
    return this.loadPromise;
  }

  getTranslatedSentimentsIdeologies(): void {
    const sentiments: SelectGroupItem2[] = this.translateAndSortGroups(
      this.rawSentiments,
      SENTIMENTS,
    );

    const ideologies: SelectGroupItem2[] = this.translateAndSortGroups(
      this.rawIdeologies,
      IDEOLOGIES,
    );

    this.sentimentsSub.next({ sentiments });
    this.ideologiesSub.next({ ideologies });
  }

  async setFilterSentiment(
    filter: Record<string, string | number | string[] | null>,
  ): Promise<FilterChartsRead> {
    return await firstValueFrom(
      this.http.post<FilterChartsRead>(
        `${this.apiUrl}/sentimentsfilter`,
        filter,
      ),
    );
  }

  async setFilterIdeology(
    filter: Record<string, string | number | string[] | null>,
  ): Promise<FilterChartsRead> {
    return await firstValueFrom(
      this.http.post<FilterChartsRead>(
        `${this.apiUrl}/ideologiesfilter`,
        filter,
      ),
    );
  }

  getItemColor(name: string, type?: string): string {
    return this.resolveColor(
      name,
      this.sentimentColorMap,
      this.ideologyColorMap,
      type,
    );
  }

  getCategoryColor(categoryKey: string, type?: string): string {
    return this.resolveColor(
      categoryKey,
      this.sentimentCategoryColorMap,
      this.ideologyCategoryColorMap,
      type,
    );
  }

  private resolveColor(
    keyName: string,
    sentimentMap: Map<string, string>,
    ideologyMap: Map<string, string>,
    type?: string,
  ): string {
    if (!keyName) return 'var(--color-accent)';
    const key = keyName.toUpperCase();
    if (type === SENTIMENTS) {
      return (
        sentimentMap.get(key) ||
        sentimentMap.get(keyName) ||
        'var(--color-accent)'
      );
    } else if (type === IDEOLOGIES) {
      return (
        ideologyMap.get(key) ||
        ideologyMap.get(keyName) ||
        'var(--color-accent)'
      );
    }
    return (
      sentimentMap.get(key) || ideologyMap.get(key) || 'var(--color-accent)'
    );
  }

  private async getSentimentsIdeologies(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<SentimentsIdeologiesRead>(
        `${this.apiUrl}/sentimentsideologies`,
      ),
    );

    const createGroups = (source: CategoryValues[] = []): SelectGroupItem2[] =>
      source.map((cat: CategoryValues) => {
        const group = new SelectGroupItem2(
          cat.category,
          cat.icon || '',
          cat.color || '',
        );
        group.items = (cat.values || []).map(
          (value: string) => new SelectItem2(value),
        );
        return group;
      });

    this.rawSentiments = createGroups(data.sentiments);
    this.rawIdeologies = createGroups(data.ideologies);

    this.populateColorMaps(data);

    this.getTranslatedSentimentsIdeologies();
  }

  private populateColorMaps(data: SentimentsIdeologiesRead): void {
    if (data.sentiments) {
      for (const cat of data.sentiments) {
        if (cat.color) {
          this.sentimentCategoryColorMap.set(cat.category, cat.color);
          this.sentimentCategoryColorMap.set(
            cat.category.toUpperCase(),
            cat.color,
          );
        }
        for (const val of cat.values) {
          const color =
            cat.color ||
            this.sentimentCategoryColorMap.get(cat.category) ||
            'var(--color-accent)';
          this.sentimentColorMap.set(val, color);
          this.sentimentColorMap.set(val.toUpperCase(), color);
          this.sentimentColorMap.set(val.toLowerCase(), color);
        }
      }
    }

    if (data.ideologies) {
      for (const cat of data.ideologies) {
        if (cat.color) {
          this.ideologyCategoryColorMap.set(cat.category, cat.color);
          this.ideologyCategoryColorMap.set(
            cat.category.toUpperCase(),
            cat.color,
          );
        }
        for (const val of cat.values) {
          const color =
            cat.color ||
            this.ideologyCategoryColorMap.get(cat.category) ||
            'var(--color-accent)';
          this.ideologyColorMap.set(val, color);
          this.ideologyColorMap.set(val.toUpperCase(), color);
          this.ideologyColorMap.set(val.toLowerCase(), color);
        }
      }
    }
  }

  private translateAndSortGroups(
    groups: SelectGroupItem2[],
    type: string,
  ): SelectGroupItem2[] {
    return groups.map((group: SelectGroupItem2) => ({
      ...group, // Spread to keep other properties
      items: group.items
        .map((item: SelectItem2) => {
          item.updateTranslation(this.trans.instant(`${type}.${item.key}`));
          return { ...item };
        })
        .sort((a: SelectItem2, b: SelectItem2) =>
          a.label.localeCompare(b.label),
        ), // Sort the new array
    }));
  }
}
