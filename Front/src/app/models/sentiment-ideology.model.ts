import { CategoryValues } from './items.model';
import { SelectGroupItem2 } from './primeng.model';

export class Ideologies {
  public ideologies: SelectGroupItem2[] = [];
}

export class Sentiments {
  public sentiments: SelectGroupItem2[] = [];
}

export class SentimentsIdeologiesRead {
  public readonly ideologies: CategoryValues[] = [];
  public readonly sentiments: CategoryValues[] = [];
}
