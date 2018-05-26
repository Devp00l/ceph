import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { RgwDaemonService } from './rgw-daemon.service';

describe('RgwDaemonService', () => {
  let service: RgwDaemonService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RgwDaemonService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(RgwDaemonService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list', () => {
    expect(service.list()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/rgw/daemon');
  });

  it('should call get', () => {
    expect(service.get('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/rgw/daemon/foo');
  });
});
