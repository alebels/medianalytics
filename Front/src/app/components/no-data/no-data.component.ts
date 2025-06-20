import { Component, OnDestroy, OnInit, input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { NoData } from '../../models/items.model';
import { ProgressBar } from 'primeng/progressbar';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-no-data',
  imports: [ProgressBar, MessageModule, TranslatePipe],
  templateUrl: './no-data.component.html',
  styleUrl: './no-data.component.css',
})
export class NoDataComponent implements OnInit, OnDestroy {
  readonly noData = input<NoData>();

  isLoading = false;
  type = 'no_data';

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.type = this.noData()?.type ?? 'no_data';
    const loadingSub = this.noData()?.isLoading?.subscribe((loading) => {
      this.isLoading = loading;
    });
    if (loadingSub) {
      this.subscriptions.push(loadingSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
