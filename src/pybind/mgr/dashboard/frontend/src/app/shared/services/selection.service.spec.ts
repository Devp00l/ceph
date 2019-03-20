import { TestBed } from '@angular/core/testing';

import { configureTestBed } from '../../../testing/unit-test-helper';
import { SelectionService } from './selection.service';

describe('SelectionService', () => {
  let selection: SelectionService;
  configureTestBed({
    providers: [SelectionService]
  });

  it('should be created', () => {
    selection = TestBed.get(SelectionService);
    expect(selection).toBeTruthy();
  });
});
