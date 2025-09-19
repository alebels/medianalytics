import { Component, OnInit, computed, input } from '@angular/core';
import { FILTERS, IDEOLOGIES, MEDIA_GROUP, SENTIMENTS } from '../../../utils/constants';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FilterDialog } from '../../../models/dialog.model';
import { GeneralService } from '../../../services/general.service';

@Component({
  selector: 'app-filters-dialog',
  imports: [CommonModule, DialogModule, TranslatePipe],
  templateUrl: './filters-dialog.component.html',
  styleUrl: './filters-dialog.component.css',
})
export class FiltersDialogComponent implements OnInit {
  readonly dataFiltersDialog = input<FilterDialog>();

  readonly TYPES = FILTERS.TYPES;
  readonly COUNTRIES = FILTERS.COUNTRIES;
  readonly REGIONS = FILTERS.REGIONS;
  readonly MEDIA_GROUP = FILTERS.MEDIA_GROUP;
  readonly SENTIMENTS = SENTIMENTS;
  readonly IDEOLOGIES = IDEOLOGIES;
  readonly MEDIAS = MEDIA_GROUP;

  header = computed(() => this.dataFiltersDialog()?.header() || '');

  // Make count reactive to both header and medias changes
  count = computed(() => {
    const header = this.dataFiltersDialog()?.header();
    const medias = this.dataFiltersDialog()?.medias || [];
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
      return sentiments.reduce((total, sentiment) => {
        return total + (sentiment.items?.length || 0);
      }, 0);
    } else if (header === this.IDEOLOGIES) {
      return ideologies.reduce((total, ideology) => {
        return total + (ideology.items?.length || 0);
      }, 0);
    } else {
      return medias.length; // For 'medias' or default case
    }
  });

  isVisible = true;
  isMobile = false;

  constructor(
    private generalSrv: GeneralService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  onClose() {
    this.generalSrv.isShowFiltersDialog$.next(false);
  }

  getMediaIcon(type: string) {
    return MEDIA_GROUP[type as keyof typeof MEDIA_GROUP]?.icon || 'newspaper';
  }

  getUniqueTypes() {
    const types =
      this.dataFiltersDialog()?.medias?.map((media) => media.type) || [];
    return Array.from(new Set(types)).sort((a, b) => a.localeCompare(b));
  }

  getItemsForType(type: string) {
    const medias = this.dataFiltersDialog()?.medias || [];
    return medias
      .filter((media) => media.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getUniqueCountries() {
    const countries =
      this.dataFiltersDialog()?.medias?.map((media) => media.country) || [];
    return Array.from(new Set(countries)).sort((a, b) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getItemsForCountry(country: string) {
    const medias = this.dataFiltersDialog()?.medias || [];
    return medias
      .filter((media) => media.country === country)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getUniqueRegions() {
    const regions =
      this.dataFiltersDialog()?.medias?.map((media) => media.region) || [];
    return Array.from(new Set(regions)).sort((a, b) => {
      const transA = this.translate.instant(this.REGIONS + '.' + a);
      const transB = this.translate.instant(this.REGIONS + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getCountriesForRegion(region: string) {
    const medias = this.dataFiltersDialog()?.medias || [];
    const countries = medias
      .filter((media) => media.region === region)
      .map((media) => media.country);
    return Array.from(new Set(countries)).sort((a, b) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getItemsForRegionAndCountry(region: string, country: string) {
    const medias = this.dataFiltersDialog()?.medias || [];
    return medias
      .filter((media) => media.region === region && media.country === country)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getSentimentsSorted() {
    const sentiments = this.dataFiltersDialog()?.sentiments || [];
    return sentiments
      .sort((a, b) => {
        const transA = this.translate.instant(this.SENTIMENTS + '.' + a.label);
        const transB = this.translate.instant(this.SENTIMENTS + '.' + b.label);
        return transA.localeCompare(transB);
      })
      .map((sentiment) => ({
        ...sentiment,
        items: sentiment.items.sort((a, b) => {
          const transA = this.translate.instant(this.SENTIMENTS + '.' + a.key);
          const transB = this.translate.instant(this.SENTIMENTS + '.' + b.key);
          return transA.localeCompare(transB);
        }),
      }));
  }

  getIdeologiesSorted() {
    const ideologies = this.dataFiltersDialog()?.ideologies || [];
    return ideologies
      .sort((a, b) => {
        const transA = this.translate.instant(this.IDEOLOGIES + '.' + a.label);
        const transB = this.translate.instant(this.IDEOLOGIES + '.' + b.label);
        return transA.localeCompare(transB);
      })
      .map((ideology) => ({
        ...ideology,
        items: ideology.items.sort((a, b) => {
          const transA = this.translate.instant(this.IDEOLOGIES + '.' + a.key);
          const transB = this.translate.instant(this.IDEOLOGIES + '.' + b.key);
          return transA.localeCompare(transB);
        }),
      }));
  }
}
