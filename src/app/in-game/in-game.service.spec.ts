import { TestBed } from '@angular/core/testing';

import { InGameService } from './in-game.service';

describe('InGameService', () => {
  let service: InGameService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InGameService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
