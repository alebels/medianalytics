import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterIdeologyComponent } from './filter-sentiment.component';

describe('FilterIdeologyComponent', () => {
  let component: FilterIdeologyComponent;
  let fixture: ComponentFixture<FilterIdeologyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterIdeologyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterIdeologyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
