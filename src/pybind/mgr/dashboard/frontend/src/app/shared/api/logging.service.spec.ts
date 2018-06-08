import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoggingService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(LoggingService);
    httpClient = TestBed.get(HttpClient);
    httpTesting = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call jsError', () => {
    service.jsError('foo', 'bar', 'baz').subscribe();
    const req = httpTesting.expectOne('ui-api/logging/js-error');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      url: 'foo',
      message: 'bar',
      stack: 'baz'
    });
  });
});
