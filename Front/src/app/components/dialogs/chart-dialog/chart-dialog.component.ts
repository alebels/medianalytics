import { Component, OnInit, computed, input } from '@angular/core';
import { ChartDialog } from '../../../models/dialog.model';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TranslatePipe } from '@ngx-translate/core';
import { isShowChartDialog$ } from '../../../utils/dialog-subjects';

@Component({
  selector: 'app-chart-dialog',
  imports: [CommonModule, DialogModule, TranslatePipe],
  templateUrl: './chart-dialog.component.html',
  styleUrl: './chart-dialog.component.css',
})
export class ChartDialogComponent implements OnInit {
  readonly dataChartDialog = input<ChartDialog>();

  count = computed(() => this.dataChartDialog()?.count() || 0);
  title = computed(() => {
    let title = '';
    if (this.dataChartDialog()?.valuation && this.dataChartDialog()?.value()) {
      title = `${
        this.dataChartDialog()?.valuation
      }.${this.dataChartDialog()?.value()}`;
    }
    return title;
  });

  isVisible = true;

  ngOnInit() {
    console.log('Chart Dialog Data:');
  }

  onClose() {
    isShowChartDialog$.next(false);
  }
}
