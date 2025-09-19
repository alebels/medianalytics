import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediasDialogComponent } from './medias-dialog.component';


describe('MediasDialogComponent', () => {
  let component: MediasDialogComponent;
  let fixture: ComponentFixture<MediasDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediasDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MediasDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
