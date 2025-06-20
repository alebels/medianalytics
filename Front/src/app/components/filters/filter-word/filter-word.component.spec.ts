import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterWordComponent } from './filter-word.component';

describe('FilterWordComponent', () => {
  let component: FilterWordComponent;
  let fixture: ComponentFixture<FilterWordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterWordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FilterWordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
