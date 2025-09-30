import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-chart-dialog',
  imports: [CommonModule, DialogModule],
  templateUrl: './chart-dialog.component.html',
  styleUrl: './chart-dialog.component.css',
})
export class ChartDialogComponent implements OnInit {
  isVisible = true;

  ngOnInit() {
    console.log('Init dialog');
  }

  onClose() {
    console.log('Close dialog');
  }
}
