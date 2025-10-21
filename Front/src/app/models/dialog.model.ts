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

export class ChartFilter {
  constructor(
    public media_id?: string,
    public type?: string,
    public country?: string,
    public region?: string,
    public rangeDates?: Date[],
    public valuation?: string // Sentiment or Ideology
  ) {}
}

export class ChartDialog extends ChartFilter {
  constructor(
    public value = signal<string>(''),
    public count = signal<number>(0)
  ) {
    super();
  }
}

class PaginationParams {
  constructor(public page = 1, public page_size?: number) {}
}

export class ChartDialogValue extends ChartFilter {
  constructor(
    public dates?: string[],
    public sentiment?: string,
    public ideology?: string,
    public word?: string
  ) {
    super();
  }
}

export class ChartDialogPaginated extends ChartDialogValue {
  constructor(public pagination: PaginationParams = new PaginationParams()) {
    super();
  }
}

class ItemUrl {
  constructor(public url: string, public frequency?: number) {}
}

export class ItemDialog {
  constructor(public media_name: string, public urls: ItemUrl[]) {}
}

export class ChartDialogPaginatedRead {
  constructor(
    public results: ItemDialog[],
    public total_count: number,
    public page: number,
    public page_size: number,
    public has_more: boolean
  ) {}
}
