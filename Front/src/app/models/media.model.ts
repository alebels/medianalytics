import { SelectItem2, SelectSimple } from './primeng.model';

export interface MediaRead {
  readonly country: string;
  readonly id: number;
  readonly name: string;
  readonly region: string;
  readonly type: string;
}

export class MediaCompose {
  constructor(
    public types: SelectItem2[] = [],
    public regions: SelectItem2[] = [],
    public countries: SelectItem2[] = []
  ) {}
}

export class MediaBase extends SelectSimple {
  constructor(
    public override readonly key: number,
    public override readonly label: string,
    public readonly type: string
  ) {
    super(key, label);
  }
}
