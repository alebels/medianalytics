import { ChartDialog } from '../models/dialog.model';
import { Subject } from 'rxjs';

export const isShowFiltersDialog$ = new Subject<boolean>();
export const filtersTypeDialog$ = new Subject<string>();

export const isShowChartDialog$ = new Subject<boolean>();
export const dataChartDialog$ = new Subject<ChartDialog>();
