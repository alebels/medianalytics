import { ChartDialog, FilterDialog } from '../../models/dialog.model';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { Ideologies, Sentiments } from '../../models/sentiment-ideology.model';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  dataChartDialog$,
  filtersTypeDialog$,
  isShowChartDialog$,
  isShowFiltersDialog$,
} from '../../utils/dialog-subjects';
import { ChartDialogComponent } from '../../components/dialogs/chart-dialog/chart-dialog.component';
import { FilterIdeologyComponent } from '../../components/filters/filter-ideology/filter-ideology.component';
import { FilterSentimentComponent } from '../../components/filters/filter-sentiment/filter-sentiment.component';
import { FilterWordComponent } from '../../components/filters/filter-word/filter-word.component';
import { FiltersDialogComponent } from '../../components/dialogs/filters-dialog/filters-dialog.component';
import { FiltersService } from '../../services/filters.service';
import { GeneralService } from '../../services/general.service';
import { MediaRead } from '../../models/media.model';
import { SentimentIdeologyService } from '../../services/sentiment-ideology.service';
import { Tooltip } from 'primeng/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-filters',
  imports: [
    FiltersDialogComponent,
    FilterSentimentComponent,
    FilterIdeologyComponent,
    FilterWordComponent,
    TranslatePipe,
    ChartDialogComponent,
    Tooltip
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css',
})
export class FiltersComponent implements OnInit {
  dataFiltersDialog!: FilterDialog;
  isShowFiltersDialog = signal(false);

  isShowChartDialog = signal(false);
  dataChartDialog = signal(new ChartDialog());

  isMobile = false;

  private generalSrv = inject(GeneralService);
  private filtersSrv = inject(FiltersService);
  private sentimentIdeologySrv = inject(SentimentIdeologyService);
  private trans = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.initializeDialogs();
    this.filtersSrv.getTranslatedMediaCompose();
    this.sentimentIdeologySrv.getTranslatedSentimentsIdeologies();
    this.isMobile = this.generalSrv.isMobile$.getValue();

    // Subscribe to language change to update translations
    this.trans.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.filtersSrv.getTranslatedMediaCompose();
        this.sentimentIdeologySrv.getTranslatedSentimentsIdeologies();
      });
  }

  private initializeDialogs(): void {
    this.setFiltersDialog();

    // Subscribe to dialog visibility changes
    isShowFiltersDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: boolean) => {
        this.isShowFiltersDialog.set(data);
        this.isShowChartDialog.set(false);
      });

    // Subscribe to dialog type changes
    filtersTypeDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type: string) => {
        this.showFiltersDialog(type);
      });

    isShowChartDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: boolean) => {
        this.isShowChartDialog.set(data);
        this.isShowFiltersDialog.set(false);
      });

    dataChartDialog$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: ChartDialog) => {
        this.dataChartDialog.set(data);
      });
  }

  private showFiltersDialog(type: string): void {
    this.isShowChartDialog.set(false);

    if (type === this.dataFiltersDialog?.header()) {
      // Same type clicked - toggle visibility
      this.isShowFiltersDialog.set(!this.isShowFiltersDialog());
    } else {
      // Different type - set new type and show dialog
      this.dataFiltersDialog.header.set(type);
      this.isShowFiltersDialog.set(true);
    }
  }

  private setFiltersDialog(): void {
    this.dataFiltersDialog = new FilterDialog([], []);
    this.filtersSrv.mediaRead$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: MediaRead[]) => {
        this.dataFiltersDialog.medias = data;
      });

    this.sentimentIdeologySrv.sentiments$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((sentimentData: Sentiments) => {
        this.dataFiltersDialog.sentiments = sentimentData.sentiments;
      });

    this.sentimentIdeologySrv.ideologies$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ideologyData: Ideologies) => {
        this.dataFiltersDialog.ideologies = ideologyData.ideologies;
      });
  }
}
