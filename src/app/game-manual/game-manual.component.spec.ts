import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameManualComponent } from './game-manual.component';

describe('GameManualComponent', () => {
  let component: GameManualComponent;
  let fixture: ComponentFixture<GameManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameManualComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GameManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
