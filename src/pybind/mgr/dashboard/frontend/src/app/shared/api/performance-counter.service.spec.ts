import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Observable, of as observableOf } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { PerformanceCounterService } from './performance-counter.service';

describe('PerformanceCounterService', () => {
  let service: PerformanceCounterService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PerformanceCounterService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(PerformanceCounterService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list', () => {
    expect(service.list()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/perf_counters');
  });

  it(
    'should call get',
    fakeAsync(() => {
      aut.spyOnReturn = observableOf([{ counters: {} }]);
      service.get('foo', '1').subscribe();
      tick();
      expect(aut.path).toBe('api/perf_counters/foo/1');
    })
  );
});
