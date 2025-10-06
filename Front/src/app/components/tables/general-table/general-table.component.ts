import { Component, OnInit, inject, input } from '@angular/core';
import {
  GeneralMediaRead,
  GeneralMediaTable,
} from '../../../models/table.model';
import { ButtonModule } from 'primeng/button';
import { Card } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { FloatLabel } from 'primeng/floatlabel';
import { GeneralService } from '../../../services/general.service';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RippleModule } from 'primeng/ripple';
import { TableModule } from 'primeng/table';
import { Tooltip } from 'primeng/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-general-table',
  imports: [
    CommonModule,
    TableModule,
    TranslatePipe,
    ButtonModule,
    RippleModule,
    InputIcon,
    IconField,
    InputTextModule,
    Card,
    FloatLabel,
    MessageModule,
    Tooltip,
  ],
  templateUrl: './general-table.component.html',
  styleUrl: './general-table.component.css',
})
export class GeneralTableComponent implements OnInit {
  readonly dataGeneralTable = input<GeneralMediaTable>();

  labelName!: string;
  labelType!: string;
  labelCountry!: string;
  labelRegion!: string;
  labelUrl!: string;
  labelTotalArticles!: string;
  labelAverageWordsArticle!: string;
  labelTopWords!: string;
  labelTopSentiments!: string;
  labelBottomSentiments!: string;
  labelTopIdeologies!: string;
  labelBottomIdeologies!: string;
  labelTopGrammar!: string;

  dataTable!: GeneralMediaRead[];
  dataTableLocked!: GeneralMediaRead[];

  select!: GeneralMediaRead;

  isMobile = false;

  private staticDataTable!: GeneralMediaRead[];
  private currentFilterValue = '';

  private generalSrv = inject(GeneralService);

  ngOnInit() {
    this.dataTableLocked = [];
    this.dataTable = [...(this.dataGeneralTable()?.data ?? [])];
    this.staticDataTable = this.dataTable;

    this.labelName = this.dataGeneralTable()?.labelName ?? '';
    this.labelType = this.dataGeneralTable()?.labelType ?? '';
    this.labelCountry = this.dataGeneralTable()?.labelCountry ?? '';
    this.labelRegion = this.dataGeneralTable()?.labelRegion ?? '';
    this.labelUrl = this.dataGeneralTable()?.labelUrl ?? '';
    this.labelTotalArticles = this.dataGeneralTable()?.labelTotalArticles ?? '';
    this.labelAverageWordsArticle =
      this.dataGeneralTable()?.labelAverageWordsArticle ?? '';
    this.labelTopWords = this.dataGeneralTable()?.labelTopWords ?? '';
    this.labelTopSentiments = this.dataGeneralTable()?.labelTopSentiments ?? '';
    this.labelBottomSentiments =
      this.dataGeneralTable()?.labelBottomSentiments ?? '';
    this.labelTopIdeologies = this.dataGeneralTable()?.labelTopIdeologies ?? '';
    this.labelBottomIdeologies =
      this.dataGeneralTable()?.labelBottomIdeologies ?? '';
    this.labelTopGrammar = this.labelTopGrammar =
      this.dataGeneralTable()?.labelTopGrammar ?? '';
    this.isMobile = this.generalSrv.isMobile$.getValue();
  }

  toggleLock(data: GeneralMediaRead, frozen: boolean) {
    if (frozen) {
      // Add to locked if not already present and limit is not reached
      if (
        !this.dataTableLocked.some((item) => item.name === data.name) &&
        this.dataTableLocked.length < 3
      ) {
        this.dataTableLocked = [...this.dataTableLocked, data]; // Use spread for immutability if preferred
      }
    } else {
      // Remove from locked
      this.dataTableLocked = this.dataTableLocked.filter(
        (item) => item.name !== data.name
      );
    }
    // Re-apply the current filter to update the visible data table
    this.applyFilter(this.currentFilterValue);
  }

  filterGlobal(value: string) {
    this.currentFilterValue = value; // Store current filter value
    this.applyFilter(value); // Apply the filter
  }

  private applyFilter(value: string) {
    let filteredData = this.staticDataTable;

    // Apply text filter if value exists
    if (value) {
      const lowerCaseValue = value.toLowerCase();
      filteredData = filteredData.filter((item) =>
        item.name.toLowerCase().includes(lowerCaseValue)
      );
    }

    // Exclude locked items from the result
    this.dataTable = filteredData.filter(
      (item) =>
        !this.dataTableLocked.some(
          (lockedItem) => lockedItem.name === item.name
        )
    );
  }
}
