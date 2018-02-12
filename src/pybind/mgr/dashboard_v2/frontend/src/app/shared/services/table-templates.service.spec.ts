import { TestBed, inject } from '@angular/core/testing';

import { TableTemplatesService } from './table-templates.service';

describe('TableTemplatesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TableTemplatesService]
    });
  });

  it('should be created', inject([TableTemplatesService], (service: TableTemplatesService) => {
    expect(service).toBeTruthy();
  }));
});
