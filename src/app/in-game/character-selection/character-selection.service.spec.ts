import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CharacterSelectionService } from './character-selection.service';

describe('CharacterSelectionService', () => {
  let service: CharacterSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(CharacterSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
