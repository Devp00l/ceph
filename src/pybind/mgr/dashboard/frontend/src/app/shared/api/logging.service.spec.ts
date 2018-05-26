import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggingService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(LoggingService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call jsError', () => {
    expect(service.jsError('foo', 'bar', 'baz')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('ui-api/logging/js-error');
    expect(aut.body).toEqual({
      url: 'foo',
      message: 'bar',
      stack: 'baz'
    });
  });
});
