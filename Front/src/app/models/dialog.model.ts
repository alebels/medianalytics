import { GeneralMedia, MediaRead } from './media.model';
import { SelectGroupItem2 } from './primeng.model';
import { signal } from '@angular/core';

export class FilterDialogChart {
  constructor(
    public readonly mediaId?: string,
    public readonly type?: string,
    public readonly country?: string,
    public readonly region?: string,
    public readonly fromDate?: Date,
    public readonly toDate?: Date,
    public readonly sentiment?: boolean,
    public readonly ideology?: boolean
  ) {}
}

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
