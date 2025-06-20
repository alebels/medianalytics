import { BehaviorSubject, firstValueFrom } from 'rxjs';
import {
  COUNTRIES,
  IDEOLOGIES,
  REGIONS,
  SENTIMENTS,
  TYPES,
} from '../utils/constants';
import {
  CategoryValues,
  FilterChartsRead,
  ItemRead,
  MinMaxDateRead,
} from '../models/items.model';
import {
  IDEOLOGIES_GROUPS,
  MEDIA_GROUPS,
  SENTIMENTS_GROUPS,
} from '../utils/groups-constant';
import {
  Ideologies,
  Sentiments,
  SentimentsIdeologiesRead,
} from '../models/sentiment-ideology.model';
import { MediaBase, MediaCompose, MediaRead } from '../models/media.model';
import {
  SelectGroupItem2,
  SelectGroupSimple,
  SelectItem2,
  SelectSimple,
} from '../models/primeng.model';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FiltersService {
  private readonly mediaCompose: MediaCompose;
  private readonly mediaComposeSub = new BehaviorSubject<MediaCompose>(
    new MediaCompose()
  );
  public readonly mediaCompose$ = this.mediaComposeSub.asObservable();

  private readonly ideologiesSub = new BehaviorSubject<Ideologies>(
    new Ideologies()
  );
  public readonly ideologies$ = this.ideologiesSub.asObservable();

  private readonly sentimentsSub = new BehaviorSubject<Sentiments>(
    new Sentiments()
  );
  public readonly sentiments$ = this.sentimentsSub.asObservable();

  private readonly mediasSub = new BehaviorSubject<SelectGroupSimple[]>([]);
  public readonly medias$ = this.mediasSub.asObservable();

  private readonly minMaxDateSub = new BehaviorSubject<MinMaxDateRead>(
    new MinMaxDateRead()
  );
  public readonly minMaxDate$ = this.minMaxDateSub.asObservable();

  private apiUrl = environment.apiUrl + '/filters';

  constructor(private http: HttpClient, private trans: TranslateService) {
    this.mediaCompose = new MediaCompose();
    this.initialize();
  }

  getTranslatedMediaCompose(): void {
    const translateAndSortItems = (groups: SelectItem2[], prefix: string) => {
      return groups
        .map((item) => {
          const newItem = new SelectItem2(item.key);
          newItem.updateTranslation(
            this.trans.instant(`${prefix}.${item.key}`)
          );
          return newItem;
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    const sendMediaCompose = new MediaCompose();
    sendMediaCompose.countries = translateAndSortItems(
      this.mediaCompose.countries,
      COUNTRIES
    );
    sendMediaCompose.regions = translateAndSortItems(
      this.mediaCompose.regions,
      REGIONS
    );
    sendMediaCompose.types = translateAndSortItems(
      this.mediaCompose.types,
      TYPES
    );
    this.mediaComposeSub.next(sendMediaCompose);
  }

  getTranslatedSentimentsIdeologies(): void {
    const sentiments = this.translateAndSortGroups(
      SENTIMENTS_GROUPS,
      SENTIMENTS
    );
    const ideologies = this.translateAndSortGroups(
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

  async setFilterWord(
    filter: Record<string, string | number | string[] | boolean | null>
  ): Promise<ItemRead[]> {
    return await firstValueFrom(
      this.http.post<ItemRead[]>(`${this.apiUrl}/wordsfilter`, filter)
    );
  }

  private async initialize(): Promise<void> {
    await Promise.all([
      this.getMediaCompose(),
      this.getSentimentsIdeologies(),
      this.getMinMaxDates(),
    ]);
  }

  private async getMediaCompose(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<MediaRead[]>(`${this.apiUrl}/medias`)
    );
    const countries = new Set<string>(),
      regions = new Set<string>(),
      types = new Set<string>();
    const medias: MediaBase[] = [];

    data.forEach((media) => {
      medias.push(new MediaBase(media.id, media.name, media.type));
      countries.add(media.country);
      regions.add(media.region);
      types.add(media.type);
    });
    medias.sort((a, b) => a.label.localeCompare(b.label));

    this.setGroupedMedia(medias);

    this.mediaCompose.countries = [...countries].map(
      (country) => new SelectItem2(country)
    );
    this.mediaCompose.regions = [...regions].map(
      (region) => new SelectItem2(region)
    );
    this.mediaCompose.types = [...types].map((type) => new SelectItem2(type));
    this.getTranslatedMediaCompose();
  }

  private setGroupedMedia(medias: MediaBase[]): void {
    const sendMediaGroups = MEDIA_GROUPS.reduce(
      (acc: SelectGroupSimple[], group) => {
        const items = medias
          .filter((media) => media.type === group.label)
          .map((media) => new SelectSimple(media.key, media.label));

        if (items.length > 0) {
          acc.push({ ...group, items });
        }
        return acc;
      },
      []
    );

    this.mediasSub.next(sendMediaGroups);
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
    ) => {
      groups.forEach((group) => {
        const categoryData = sourceCategories.find(
          (cat) => cat.category === group.label
        );
        if (categoryData) {
          group.items = categoryData.values.map(
            (value) => new SelectItem2(value)
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
    return groups.map((group) => ({
      ...group, // Spread to keep other properties
      items: group.items
        .map((item) => {
          item.updateTranslation(this.trans.instant(`${type}.${item.key}`));
          return { ...item };
        })
        .sort((a, b) => a.label.localeCompare(b.label)), // Sort the new array
    }));
  }

  private async getMinMaxDates(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<MinMaxDateRead>(`${this.apiUrl}/minmaxdate`)
    );
    this.minMaxDateSub.next(data);
  }
}
