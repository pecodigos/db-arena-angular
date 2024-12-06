import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LadderSystemComponent } from './ladder-system.component';

describe('LadderSystemComponent', () => {
  let component: LadderSystemComponent;
  let fixture: ComponentFixture<LadderSystemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LadderSystemComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LadderSystemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
