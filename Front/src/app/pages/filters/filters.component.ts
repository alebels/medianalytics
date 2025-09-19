import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FilterDialog } from '../../models/dialog.model';
import { FilterIdeologyComponent } from '../../components/filters/filter-ideology/filter-ideology.component';
import { FilterSentimentComponent } from '../../components/filters/filter-sentiment/filter-sentiment.component';
import { FilterWordComponent } from '../../components/filters/filter-word/filter-word.component';
import { FiltersDialogComponent } from '../../components/dialogs/filters-dialog/filters-dialog.component';
import { FiltersService } from '../../services/filters.service';
import { GeneralService } from '../../services/general.service';
import { MediaRead } from '../../models/media.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filters',
  imports: [
    FiltersDialogComponent,
    FilterSentimentComponent,
    FilterIdeologyComponent,
    FilterWordComponent,
    TranslatePipe,
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css',
})
export class FiltersComponent implements OnInit, OnDestroy {
  dataFiltersDialog!: FilterDialog;
  isShowFiltersDialog = false;

  private subscriptions: Subscription[] = [];

  constructor(
    private filtersSrv: FiltersService,
    private generalSrv: GeneralService,
    private trans: TranslateService
  ) {}

  ngOnInit(): void {
    this.initializeDialogs();
    // Subscribe to language change to update translations
    const langChangeSub = this.trans.onLangChange.subscribe(() => {
      this.filtersSrv.getTranslatedMediaCompose();
      this.filtersSrv.getTranslatedSentimentsIdeologies();
    });
    this.subscriptions.push(langChangeSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription: Subscription) =>
      subscription.unsubscribe()
    );
  }

  private initializeDialogs(): void {
    this.setFiltersDialog();
    // Subscribe to dialog visibility changes
    const isShowDialogSub = this.generalSrv.isShowFiltersDialog$.subscribe(
      (data) => {
        this.isShowFiltersDialog = data;
      }
    );
    this.subscriptions.push(isShowDialogSub);
    // Subscribe to dialog type changes
    const dialogTypeSub = this.generalSrv.filtersTypeDialog$.subscribe(
      (type) => {
        this.showFiltersDialog(type);
      }
    );
    this.subscriptions.push(dialogTypeSub);
  }

  private showFiltersDialog(type: string) {
    if (type === this.dataFiltersDialog?.header()) {
      // Same type clicked - toggle visibility
      this.isShowFiltersDialog = !this.isShowFiltersDialog;
    } else {
      // Different type - set new type and show dialog
      this.dataFiltersDialog.header.set(type);
      this.isShowFiltersDialog = true;
    }
  }

  private setFiltersDialog(): void {
    this.dataFiltersDialog = new FilterDialog([], [], []);
    const mediaDataSub = this.filtersSrv.mediaRead$.subscribe(
      (data: MediaRead[]) => {
        this.dataFiltersDialog.medias = data;
      }
    );
    this.subscriptions.push(mediaDataSub);
    const sentimentDataSub = this.filtersSrv.sentiments$.subscribe(
      (sentimentData) => {
        this.dataFiltersDialog.sentiments = sentimentData.sentiments;
      }
    );
    this.subscriptions.push(sentimentDataSub);
    const ideologiesDataSub = this.filtersSrv.ideologies$.subscribe(
      (ideologyData) => {
        this.dataFiltersDialog.ideologies = ideologyData.ideologies;
      }
    );
    this.subscriptions.push(ideologiesDataSub);
  }
}
