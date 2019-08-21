import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { configureTestBed } from '../../../testing/unit-test-helper';
import { CephfsService } from './cephfs.service';

describe('CephfsService', () => {
  let service: CephfsService;
  let httpTesting: HttpTestingController;

  configureTestBed({
    imports: [HttpClientTestingModule],
    providers: [CephfsService]
  });

  beforeEach(() => {
    service = TestBed.get(CephfsService);
    httpTesting = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list', () => {
    service.list().subscribe();
    const req = httpTesting.expectOne('api/cephfs');
    expect(req.request.method).toBe('GET');
  });

  it('should call getCephfs', () => {
    service.getCephfs(1).subscribe();
    const req = httpTesting.expectOne('api/cephfs/1');
    expect(req.request.method).toBe('GET');
  });

  it('should call getClients', () => {
    service.getClients(1).subscribe();
    const req = httpTesting.expectOne('api/cephfs/1/clients');
    expect(req.request.method).toBe('GET');
  });

  it('should call getTabs', () => {
    service.getTabs(2).subscribe();
    const req = httpTesting.expectOne('ui-api/cephfs/2/tabs');
    expect(req.request.method).toBe('GET');
  });

  it('should call getMdsCounters', () => {
    service.getMdsCounters(1).subscribe();
    const req = httpTesting.expectOne('api/cephfs/1/mds_counters');
    expect(req.request.method).toBe('GET');
  });

  it('should call lsDir', () => {
    service.lsDir(1).subscribe();
    const req = httpTesting.expectOne('api/cephfs/1/ls_dir');
    expect(req.request.method).toBe('GET');
    service.lsDir(2, '/some/path').subscribe();
    httpTesting.expectOne('api/cephfs/2/ls_dir?path=%2Fsome%2Fpath');
  });
});
