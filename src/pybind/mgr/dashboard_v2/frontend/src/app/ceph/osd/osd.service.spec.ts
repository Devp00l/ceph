import { TestBed, inject } from '@angular/core/testing';

import { OsdService } from './osd.service';

describe('OsdService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OsdService]
    });
  });

  it('should be created', inject([OsdService], (service: OsdService) => {
    expect(service).toBeTruthy();
  }));
});
