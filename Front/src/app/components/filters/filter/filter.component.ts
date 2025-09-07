import {
  Component,
  OnDestroy,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  DATE,
  FILTERS,
  MEDIAS
} from '../../../utils/constants';
import {
  FilterItem,
  SelectGroupSimple,
  SelectItem2,
  SelectSimple,
} from '../../../models/primeng.model';
import { DatePicker } from 'primeng/datepicker';
import { FiltersService } from '../../../services/filters.service';
import { FloatLabel } from 'primeng/floatlabel';
import { FormsModule } from '@angular/forms';
import { GeneralService } from '../../../services/general.service';
import { MinMaxDateRead } from '../../../models/items.model';
import { MultiSelectModule } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-filter',
  imports: [
    FormsModule,
    MultiSelectModule,
    FloatLabel,
    TranslatePipe,
    Select,
    DatePicker,
  ],
  templateUrl: './filter.component.html',
  styleUrl: './filter.component.css',
  standalone: true,
})
export class FilterComponent implements OnInit, OnDestroy {
  readonly MEDIAS = MEDIAS;

  mediaCompose: FilterItem[] = [
    {
      type: MEDIAS,
      data: signal<SelectGroupSimple[]>([]),
      value: signal<SelectSimple | null>(null),
      disabled: signal<boolean>(false),
    },
    {
      type: FILTERS.TYPES,
      data: signal<SelectItem2[]>([]),
      value: signal<SelectItem2 | null>(null),
      disabled: signal<boolean>(false),
    },
    {
      type: FILTERS.COUNTRIES,
      data: signal<SelectItem2[]>([]),
      value: signal<SelectItem2 | null>(null),
      disabled: signal<boolean>(false),
    },
    {
      type: FILTERS.REGIONS,
      data: signal<SelectItem2[]>([]),
      value: signal<SelectItem2 | null>(null),
      disabled: signal<boolean>(false),
    },
  ];

  composeValues =
    output<{ type: string; key: string | number | string[] | null }[]>();

  rangeDates: Date[] | null = null;
  minDate: Date | null = null;
  maxDate: Date | null = null;

  absoluteMinDate: Date | null = null;
  absoluteMaxDate: Date | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private filtersSrv: FiltersService,
    private generalSrv: GeneralService
  ) {}

  ngOnInit(): void {
    this.setMedias();
    this.setMediaCompose();
    this.getMinMaxDate();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  onSelectCompose(event: FilterItem): void {
    if (event.type === MEDIAS) {
      // When MEDIAS is selected, disable all others
      this.mediaCompose.forEach((item) => {
        if (item.type !== MEDIAS) {
          item.value.set(null);
          item.disabled.set(!!event.value());
        }
      });
    } else if (event.type === FILTERS.TYPES) {
      // When TYPE is selected or cleared, check other selections
      this.mediaCompose.forEach((item) => {
        if (item.type === MEDIAS) {
          // Check if any region or country is selected
          const regionSelected = this.mediaCompose
            .find((i) => i.type === FILTERS.REGIONS)
            ?.value();
          const countrySelected = this.mediaCompose
            .find((i) => i.type === FILTERS.COUNTRIES)
            ?.value();

          // Disable MEDIAS if TYPE has value OR if REGION/COUNTRY has value
          const shouldDisableMedia =
            !!event.value() || !!regionSelected || !!countrySelected;

          item.value.set(null);
          item.disabled.set(shouldDisableMedia);
        }
      });
    } else {
      // When COUNTRY or REGION is selected, disable MEDIAS and the other one between COUNTRY/REGION
      this.mediaCompose.forEach((item) => {
        if (item.type === MEDIAS) {
          // Disable MEDIAS if either this item has value OR if TYPE has value
          const typeHasValue = !!this.mediaCompose
            .find((i) => i.type === FILTERS.TYPES)
            ?.value();
          item.value.set(null);
          item.disabled.set(!!event.value() || typeHasValue);
        } else if (
          (item.type === FILTERS.REGIONS || item.type === FILTERS.COUNTRIES) &&
          item.type !== event.type
        ) {
          // Clear and disable the other geographic filter (REGION/COUNTRY)
          item.value.set(null);
          item.disabled.set(!!event.value());
        }
      });
    }
    this.sendComposeValue();
  }

  sendComposeValue(): void {
    const values: { type: string; key: string | number | string[] | null }[] =
      [];

    this.mediaCompose.forEach((item) => {
      if (item.value()) {
        values.push({
          type: item.type,
          key: item.value().key,
        });
      }
    });
    if (this.rangeDates) {
      if (
        this.rangeDates.length === 2 &&
        this.rangeDates[0] &&
        this.rangeDates[1] &&
        this.rangeDates[0].toDateString() === this.rangeDates[1].toDateString()
      ) {
        this.rangeDates.pop(); // Remove the second date if it's the same as the first
        return;
      }
      const dates = this.rangeDates
        .map((date) => {
          if (date) {
            return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString()
              .split('T')[0];
          }
          return '';
        })
        .filter((date) => date); // Filter out any empty strings
      values.push({
        type: DATE,
        key: dates,
      });
    }
    this.composeValues.emit(values);
  }

  private getMinMaxDate(): void {
    const minMaxDateSub = this.generalSrv.minMaxDate$.subscribe(
      (data: MinMaxDateRead) => {
        this.absoluteMinDate = new Date(data.min_date);
        this.absoluteMaxDate = new Date(data.max_date);
      }
    );
    this.subscriptions.push(minMaxDateSub);
  }

  private setMedias(): void {
    const mediaSub = this.filtersSrv.medias$.subscribe(
      (data: SelectGroupSimple[]) => {
        const item = this.mediaCompose.find((item) => item.type === MEDIAS);
        if (item) {
          item.data.set(data);
          item.value.set(null);
          item.disabled.set(false);
        }
      }
    );
    this.subscriptions.push(mediaSub);
  }

  private setMediaCompose(): void {
    const mediaComposeSub = this.filtersSrv.mediaCompose$.subscribe((data) => {
      Object.keys(data).forEach((key) => {
        const item = this.mediaCompose.find((item) => item.type === key);
        if (item && key in data) {
          item.data.set(data[key as keyof typeof data]);
          item.value.set(null);
          item.disabled.set(false);
        }
      });
      const mediaItem = this.mediaCompose.find((item) => item.type === MEDIAS);
      if (mediaItem) {
        mediaItem.disabled.set(false);
        mediaItem.value.set(null);
      }
      this.rangeDates = null;
    });
    this.subscriptions.push(mediaComposeSub);
  }
}
