import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { MediaBase, MediaCompose, MediaRead } from '../models/media.model';
import {
  SelectGroupSimple,
  SelectItem2,
  SelectSimple,
} from '../models/primeng.model';
import { FILTERS } from '../utils/constants';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ItemRead } from '../models/items.model';
import { MEDIA_GROUPS } from '../utils/groups-constant';
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

  private readonly mediasSub = new BehaviorSubject<SelectGroupSimple[]>([]);
  public readonly medias$ = this.mediasSub.asObservable();

  private readonly mediaReadSub = new BehaviorSubject<MediaRead[]>([]);
  public readonly mediaRead$ = this.mediaReadSub.asObservable();

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
      FILTERS.COUNTRIES
    );
    sendMediaCompose.regions = translateAndSortItems(
      this.mediaCompose.regions,
      FILTERS.REGIONS
    );
    sendMediaCompose.types = translateAndSortItems(
      this.mediaCompose.types,
      FILTERS.TYPES
    );
    this.mediaComposeSub.next(sendMediaCompose);
  }

  async setFilterWord(
    filter: Record<string, string | number | string[] | boolean | null>
  ): Promise<ItemRead[]> {
    return await firstValueFrom(
      this.http.post<ItemRead[]>(`${this.apiUrl}/wordsfilter`, filter)
    );
  }

  private async initialize(): Promise<void> {
    await this.getMediaCompose();
  }

  private async getMediaCompose(): Promise<void> {
    const data = await firstValueFrom(
      this.http.get<MediaRead[]>(`${this.apiUrl}/medias`)
    );
    this.mediaReadSub.next(data);
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
}
