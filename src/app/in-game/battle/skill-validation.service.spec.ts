import { TestBed } from '@angular/core/testing';

import { SkillValidationService } from './skill-validation.service';

describe('SkillValidationService', () => {
  let service: SkillValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SkillValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
