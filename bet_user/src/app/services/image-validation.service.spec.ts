import { TestBed } from '@angular/core/testing';

import { ImageValidationService } from './image-validation.service';

describe('ImageValidationService', () => {
  let service: ImageValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
