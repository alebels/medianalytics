import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterSentimentComponent } from './filter-sentiment.component';

describe('FilterSentimentComponent', () => {
  let component: FilterSentimentComponent;
  let fixture: ComponentFixture<FilterSentimentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterSentimentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterSentimentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
