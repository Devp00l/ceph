import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { PoolService } from './pool.service';

describe('PoolService', () => {
  let service: PoolService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PoolService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(PoolService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getList', () => {
    expect(service.getList()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/pool');
  });

  it(
    'should call list without parameter',
    fakeAsync(() => {
      expect(service.list()).toEqual(jasmine.any(Promise));
      tick();
      expect(aut.path).toBe('api/pool?attrs=');
    })
  );

  it(
    'should call list with a list',
    fakeAsync(() => {
      expect(service.list(['foo'])).toEqual(jasmine.any(Promise));
      tick();
      expect(aut.path).toBe('api/pool?attrs=foo');
    })
  );
});
