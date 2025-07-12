import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FilterIdeologyComponent } from '../../components/filters/filter-ideology/filter-ideology.component';
import { FilterSentimentComponent } from '../../components/filters/filter-sentiment/filter-sentiment.component';
import { FilterWordComponent } from '../../components/filters/filter-word/filter-word.component';
import { FiltersService } from '../../services/filters.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-filters',
  imports: [
    FilterSentimentComponent,
    FilterIdeologyComponent,
    FilterWordComponent,
    TranslatePipe,
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.css',
})
export class FiltersComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];

  constructor(
    private filtersSrv: FiltersService,
    private trans: TranslateService
  ) {}

  ngOnInit(): void {
    this.filtersSrv.getTranslatedMediaCompose();
    this.filtersSrv.getTranslatedSentimentsIdeologies();
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
}
