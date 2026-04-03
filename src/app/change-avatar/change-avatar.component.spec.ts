import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ChangeAvatarComponent } from './change-avatar.component';

describe('ChangeAvatarComponent', () => {
  let component: ChangeAvatarComponent;
  let fixture: ComponentFixture<ChangeAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeAvatarComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ],
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeAvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
