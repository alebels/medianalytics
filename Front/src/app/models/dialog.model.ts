import { GeneralMedia, MediaRead } from './media.model';
import { SelectGroupItem2 } from './primeng.model';
import { signal } from '@angular/core';

export class MediaDialog {
  constructor(
    public readonly header = '',
    public readonly items: GeneralMedia[] = []
  ) {}
}

export class FilterDialog {
  header = signal<string | undefined>(undefined);

  constructor(
    public medias: MediaRead[] = [],
    public sentiments: SelectGroupItem2[],
    public ideologies: SelectGroupItem2[],
    header?: string
  ) {
    this.header.set(header);
  }
}
