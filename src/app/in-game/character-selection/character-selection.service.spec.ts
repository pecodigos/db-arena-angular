import { TestBed } from '@angular/core/testing';

import { CharacterSelectionService } from './character-selection.service';

describe('CharacterSelectionService', () => {
  let service: CharacterSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterSelectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
