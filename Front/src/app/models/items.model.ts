import { BehaviorSubject } from 'rxjs';

export interface ItemRead {
  readonly name: string;
  readonly count: number;
}

export interface CategoryValues {
  readonly category: string;
  readonly values: string[];
}

export interface CompoundRead {
  readonly plain: ItemRead[];
  readonly categorized: ItemRead[];
}

export interface ItemSerie {
  readonly name: string;
  readonly data: (number | null)[];
}

export interface DateChartRead {
  readonly items: ItemSerie[];
  readonly labels: string[];
}

export interface NoData {
  isLoading?: BehaviorSubject<boolean>;
  readonly type: string;
}

export class FilterChartsRead {
  constructor(
    public readonly plain: ItemRead[] | null = null,
    public readonly categorized: ItemRead[] | null = null,
    public readonly date_chart: DateChartRead | null = null
  ) {}
}

export class MinMaxDateRead {
  constructor(public readonly min_date = '', public readonly max_date = '') {}
}
