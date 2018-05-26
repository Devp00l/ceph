import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { RbdService } from './rbd.service';

describe('RbdService', () => {
  let service: RbdService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RbdService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(RbdService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call create', () => {
    expect(service.create('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image');
    expect(aut.body).toBe('foo');
  });

  it('should call delete', () => {
    expect(service.delete('poolName', 'rbdName')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/poolName/rbdName');
  });

  it('should call update', () => {
    expect(service.update('poolName', 'rbdName', 'foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/poolName/rbdName');
    expect(aut.body).toBe('foo');
  });

  it('should call get', () => {
    expect(service.get('poolName', 'rbdName')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/poolName/rbdName');
  });

  it('should call list', () => {
    expect(service.list()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image');
  });

  it('should call copy', () => {
    expect(service.copy('poolName', 'rbdName', 'foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/poolName/rbdName/copy');
    expect(aut.body).toBe('foo');
  });

  it('should call flatten', () => {
    expect(service.flatten('poolName', 'rbdName')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/poolName/rbdName/flatten');
    expect(aut.body).toBe(null);
  });

  it('should call defaultFeatures', () => {
    expect(service.defaultFeatures()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/block/image/default_features');
  });

  it('should call createSnapshot', () => {
    expect(service.createSnapshot('poolName', 'rbdName', 'snapshotName')).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap');
    expect(aut.body).toEqual({
      snapshot_name: 'snapshotName'
    });
  });

  it('should call renameSnapshot', () => {
    expect(service.renameSnapshot('poolName', 'rbdName', 'snapshotName', 'foo')).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap/snapshotName');
    expect(aut.body).toEqual({
      new_snap_name: 'foo'
    });
  });

  it('should call protectSnapshot', () => {
    expect(service.protectSnapshot('poolName', 'rbdName', 'snapshotName', true)).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap/snapshotName');
    expect(aut.body).toEqual({
      is_protected: true
    });
  });

  it('should call rollbackSnapshot', () => {
    expect(service.rollbackSnapshot('poolName', 'rbdName', 'snapshotName')).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap/snapshotName/rollback');
    expect(aut.body).toBe(null);
  });

  it('should call cloneSnapshot', () => {
    expect(service.cloneSnapshot('poolName', 'rbdName', 'snapshotName', null)).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap/snapshotName/clone');
    expect(aut.body).toBe(null);
  });

  it('should call deleteSnapshot', () => {
    expect(service.deleteSnapshot('poolName', 'rbdName', 'snapshotName')).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('api/block/image/poolName/rbdName/snap/snapshotName');
  });
});
