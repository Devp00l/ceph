import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { CephfsService } from './cephfs.service';

describe('CephfsService', () => {
  let service: CephfsService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CephfsService]
    });

    service = TestBed.get(CephfsService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list', () => {
    expect(service.list()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/cephfs');
  });

  it('should call getCephfs', () => {
    expect(service.getCephfs(1)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/cephfs/1');
  });

  it('should call getClients', () => {
    expect(service.getClients(1)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/cephfs/1/clients');
  });

  it('should call getMdsCounters', () => {
    expect(service.getMdsCounters(1)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/cephfs/1/mds_counters');
  });
});
