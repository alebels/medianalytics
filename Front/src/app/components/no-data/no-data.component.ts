import { Component, DestroyRef, OnInit, inject, input } from '@angular/core';
import { MessageModule } from 'primeng/message';
import { NO_DATA } from '../../utils/constants';
import { NoData } from '../../models/items.model';
import { ProgressBar } from 'primeng/progressbar';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-no-data',
  imports: [ProgressBar, MessageModule, TranslatePipe],
  templateUrl: './no-data.component.html',
  styleUrl: './no-data.component.css',
})
export class NoDataComponent implements OnInit {
  readonly noData = input<NoData>();
  readonly loadingHomeText = NO_DATA.LOADING_HOME;

  isLoading = false;
  type!: string;

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.type = this.noData()?.type ?? NO_DATA.NO_DATA;
    this.noData()
      ?.isLoading?.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading: boolean) => {
        this.isLoading = loading;
      });
  }
}
