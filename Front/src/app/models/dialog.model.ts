import { GeneralMedia, MediaRead } from './media.model';
import { SelectGroupItem2 } from './primeng.model';
import { signal } from '@angular/core';

export class FilterDialog {
  header = signal<string | undefined>(undefined);

  constructor(
    public sentiments: SelectGroupItem2[],
    public ideologies: SelectGroupItem2[],
    public generalMedias?: GeneralMedia[],
    public medias?: MediaRead[],
    header?: string
  ) {
    this.header.set(header);
  }
}

export class ChartDialog {
  constructor(
    public value = signal<string>(''),
    public count = signal<number>(0),
    public mediaId?: string,
    public type?: string,
    public country?: string,
    public region?: string,
    public rangeDates?: Date[],
    public valuation?: string
  ) {}
}
