import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { RbdMirroringService } from './rbd-mirroring.service';

describe('RbdMirroringService', () => {
  let service: RbdMirroringService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RbdMirroringService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(RbdMirroringService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call get', () => {
    expect(service.get()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/rbdmirror');
  });
});
