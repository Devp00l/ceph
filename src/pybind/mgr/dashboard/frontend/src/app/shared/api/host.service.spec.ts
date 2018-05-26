import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ApiUnitTest } from '../tests/util';
import { HostService } from './host.service';

describe('HostService', () => {
  let service: HostService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HostService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(HostService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it(
    'should call list',
    fakeAsync(() => {
      expect(service.list()).toEqual(jasmine.any(Promise));
      tick();
      expect(aut.path).toBe('api/host');
    })
  );
});
