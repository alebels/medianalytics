import { Component, OnInit, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataCountTable } from '../../../models/table.model';
import { ItemRead } from '../../../models/items.model';
import { TableModule } from 'primeng/table';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-sort-table',
  imports: [CommonModule, TableModule, TranslatePipe],
  templateUrl: './sort-table.component.html',
  styleUrl: './sort-table.component.css'
})
export class SortTableComponent implements OnInit {

  readonly dataSortTable = input<DataCountTable>();

  sortOrder!: number;

  dataTable: ItemRead[] = [];

  select!: ItemRead;

  label1!: string;
  label2!: string;

  ngOnInit(): void {
    this.dataTable = [...this.dataSortTable()?.data ?? []];
    this.label1 = this.dataSortTable()?.label1 ?? '';
    this.label2 = this.dataSortTable()?.label2 ?? '';
    this.sortOrder = this.dataSortTable()?.sortOrder ?? 1;
  }

}
