import { Component, OnInit, input } from '@angular/core';
import { FILTERS, MEDIA_GROUP } from '../../../utils/constants';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { GeneralService } from '../../../services/general.service';
import { MediaDialog } from '../../../models/dialog.model';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-medias-dialog',
  imports: [CommonModule, DialogModule, TranslatePipe, Tooltip],
  templateUrl: './medias-dialog.component.html',
  styleUrl: './medias-dialog.component.css',
})
export class MediasDialogComponent implements OnInit {
  readonly dataMediasDialog = input<MediaDialog>();
  
  readonly MEDIA_GROUP = FILTERS.MEDIA_GROUP;
  readonly COUNTRIES = FILTERS.COUNTRIES;
  readonly MEDIAS = MEDIA_GROUP;
  
  header!: string;

  isVisible = true;
  isMobile = false;


  constructor(
    private generalSrv: GeneralService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.header = this.dataMediasDialog()?.header || '';
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  onClose() {
    this.generalSrv.isShowMediasDialog$.next(false);
  }

  getMediaIcon(type: string) {
    return MEDIA_GROUP[type as keyof typeof MEDIA_GROUP]?.icon || 'newspaper';
  }

  getUniqueTypes() {
    const types =
      this.dataMediasDialog()?.items?.map((item) => item.type) || [];
    return Array.from(new Set(types));
  }

  getCountriesForType(type: string) {
    const items = this.dataMediasDialog()?.items || [];
    const countries = items
      .filter((item) => item.type === type)
      .map((item) => item.country);
    const uniqueCountries = Array.from(new Set(countries));
    return uniqueCountries.sort((a, b) => {
      const transA = this.translate.instant(this.COUNTRIES + '.' + a);
      const transB = this.translate.instant(this.COUNTRIES + '.' + b);
      return transA.localeCompare(transB);
    });
  }

  getItemsForTypeAndCountry(type: string, country: string) {
    const filteredItems =
      this.dataMediasDialog()?.items?.filter(
        (item) => item.type === type && item.country === country
      ) || [];
    return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
  }
}
