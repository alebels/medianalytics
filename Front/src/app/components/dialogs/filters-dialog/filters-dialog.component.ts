import { Component, computed, inject, input } from '@angular/core';
import {
  FILTERS,
  IDEOLOGIES,
  MEDIAS,
  MEDIA_GROUP,
  SENTIMENTS,
} from '../../../utils/constants';
import { GeneralMedia, MediaRead } from '../../../models/media.model';
import { SelectGroupItem2, SelectItem2 } from '../../../models/primeng.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FilterDialog } from '../../../models/dialog.model';
import { GeneralService } from '../../../services/general.service';
import { Tooltip } from 'primeng/tooltip';
import { isShowFiltersDialog$ } from '../../../utils/dialog-subjects';

@Component({
  selector: 'app-filters-dialog',
  imports: [CommonModule, DialogModule, TranslatePipe, Tooltip],
  templateUrl: './filters-dialog.component.html',
  styleUrl: './filters-dialog.component.css',
})
export class FiltersDialogComponent {
  readonly dataFiltersDialog = input<FilterDialog>();

  readonly TYPES = FILTERS.TYPES;
  readonly COUNTRIES = FILTERS.COUNTRIES;
  readonly REGIONS = FILTERS.REGIONS;
  readonly MEDIA_GROUP = FILTERS.MEDIA_GROUP;
  readonly SENTIMENTS = SENTIMENTS;
  readonly IDEOLOGIES = IDEOLOGIES;
  readonly GENERAL_MEDIAS = MEDIAS;

  header = computed(() => this.dataFiltersDialog()?.header() || '');

  // Make count reactive to both header and medias changes
  count = computed(() => {
    const header = this.dataFiltersDialog()?.header();
    const medias = this.dataFiltersDialog()?.medias || [];
    const generalMedias = this.dataFiltersDialog()?.generalMedias || [];
    const sentiments = this.dataFiltersDialog()?.sentiments || [];
    const ideologies = this.dataFiltersDialog()?.ideologies || [];

    if (!header) return 0;

    // Calculate count based on header type
    if (header === this.TYPES) {
      const types = medias.map((media) => media.type) || [];
      return Array.from(new Set(types)).length;
    } else if (header === this.COUNTRIES) {
      const countries = medias.map((media) => media.country) || [];
      return Array.from(new Set(countries)).length;
    } else if (header === this.REGIONS) {
      const regions = medias.map((media) => media.region) || [];
      return Array.from(new Set(regions)).length;
    } else if (header === this.SENTIMENTS) {
      return sentiments.reduce((total: number, sentiment: SelectGroupItem2) => {
        return total + (sentiment.items?.length || 0);
      }, 0);
    } else if (header === this.IDEOLOGIES) {
      return ideologies.reduce((total: number, ideology: SelectGroupItem2) => {
        return total + (ideology.items?.length || 0);
      }, 0);
    } else if (header === this.GENERAL_MEDIAS) {
      return generalMedias.length;
    } else {
      return medias.length; // For 'medias' or default case
    }
  });

  isVisible = true;
  isMobile = false;

  private generalSrv = inject(GeneralService);
  private translate = inject(TranslateService);

  constructor() {
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  onClose(): void {
    isShowFiltersDialog$.next(false);
  }

  getMediaIcon(type: string): string {
    return MEDIA_GROUP[type as keyof typeof MEDIA_GROUP]?.icon || 'newspaper';
  }

  getUniqueGeneralTypes(): string[] {
    const types: string[] =
      this.dataFiltersDialog()?.generalMedias?.map(
        (media: GeneralMedia) => media.type
      ) || [];

    return Array.from(new Set(types)).sort((a: string, b: string) =>
      a.localeCompare(b)
    );
  }

  getCountriesForType(type: string): string[] {
    const medias: GeneralMedia[] =
      this.dataFiltersDialog()?.generalMedias || [];

    const countries: string[] = medias
      .filter((media: GeneralMedia) => media.type === type)
      .map((media: GeneralMedia) => media.country);

    const uniqueCountries: string[] = Array.from(new Set(countries));

    return uniqueCountries.sort((a: string, b: string) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getMediasForTypeAndCountry(type: string, country: string): GeneralMedia[] {
    const filteredItems: GeneralMedia[] =
      this.dataFiltersDialog()?.generalMedias?.filter(
        (media: GeneralMedia) =>
          media.type === type && media.country === country
      ) || [];

    return filteredItems.sort((a: GeneralMedia, b: GeneralMedia) =>
      a.name.localeCompare(b.name)
    );
  }

  getUniqueTypes(): string[] {
    const types: string[] =
      this.dataFiltersDialog()?.medias?.map((media: MediaRead) => media.type) ||
      [];

    return Array.from(new Set(types)).sort((a: string, b: string) =>
      a.localeCompare(b)
    );
  }

  getMediaForType(type: string): MediaRead[] {
    const medias: MediaRead[] = this.dataFiltersDialog()?.medias || [];

    return medias
      .filter((media: MediaRead) => media.type === type)
      .sort((a: MediaRead, b: MediaRead) => a.name.localeCompare(b.name));
  }

  getUniqueCountries(): string[] {
    const countries: string[] =
      this.dataFiltersDialog()?.medias?.map(
        (media: MediaRead) => media.country
      ) || [];

    return Array.from(new Set(countries)).sort((a: string, b: string) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getMediaForCountry(country: string): MediaRead[] {
    const medias: MediaRead[] = this.dataFiltersDialog()?.medias || [];

    return medias
      .filter((media: MediaRead) => media.country === country)
      .sort((a: MediaRead, b: MediaRead) => a.name.localeCompare(b.name));
  }

  getUniqueRegions(): string[] {
    const regions: string[] =
      this.dataFiltersDialog()?.medias?.map(
        (media: MediaRead) => media.region
      ) || [];

    return Array.from(new Set(regions)).sort((a: string, b: string) => {
      const transA = this.translate.instant(this.REGIONS + '.' + a);
      const transB = this.translate.instant(this.REGIONS + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getCountriesForRegion(region: string): string[] {
    const medias: MediaRead[] = this.dataFiltersDialog()?.medias || [];

    const countries: string[] = medias
      .filter((media: MediaRead) => media.region === region)
      .map((media: MediaRead) => media.country);

    return Array.from(new Set(countries)).sort((a: string, b: string) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getMediaForRegionAndCountry(region: string, country: string): MediaRead[] {
    const medias: MediaRead[] = this.dataFiltersDialog()?.medias || [];

    return medias
      .filter(
        (media: MediaRead) =>
          media.region === region && media.country === country
      )
      .sort((a: MediaRead, b: MediaRead) => a.name.localeCompare(b.name));
  }

  getSentimentsSorted(): SelectGroupItem2[] {
    const sentiments: SelectGroupItem2[] =
      this.dataFiltersDialog()?.sentiments || [];

    return sentiments
      .sort((a: SelectGroupItem2, b: SelectGroupItem2) => {
        const transA = this.translate.instant(this.SENTIMENTS + '.' + a.label);
        const transB = this.translate.instant(this.SENTIMENTS + '.' + b.label);
        return transA.localeCompare(transB);
      })
      .map((sentiment: SelectGroupItem2) => ({
        ...sentiment,
        items: sentiment.items.sort((a: SelectItem2, b: SelectItem2) => {
          const transA = this.translate.instant(this.SENTIMENTS + '.' + a.key);
          const transB = this.translate.instant(this.SENTIMENTS + '.' + b.key);
          return transA.localeCompare(transB);
        }),
      }));
  }

  getIdeologiesSorted(): SelectGroupItem2[] {
    const ideologies: SelectGroupItem2[] =
      this.dataFiltersDialog()?.ideologies || [];

    return ideologies
      .sort((a: SelectGroupItem2, b: SelectGroupItem2) => {
        const transA = this.translate.instant(this.IDEOLOGIES + '.' + a.label);
        const transB = this.translate.instant(this.IDEOLOGIES + '.' + b.label);
        return transA.localeCompare(transB);
      })
      .map((ideology: SelectGroupItem2) => ({
        ...ideology,
        items: ideology.items.sort((a: SelectItem2, b: SelectItem2) => {
          const transA = this.translate.instant(this.IDEOLOGIES + '.' + a.key);
          const transB = this.translate.instant(this.IDEOLOGIES + '.' + b.key);
          return transA.localeCompare(transB);
        }),
      }));
  }
}
