import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Observable, of as observableOf } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { RgwBucketService } from './rgw-bucket.service';

describe('RgwBucketService', () => {
  let service: RgwBucketService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RgwBucketService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(RgwBucketService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
    aut.spyOnReturn = observableOf([]);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it(
    'should call list, with enumerate returning empty',
    fakeAsync(() => {
      service.list().subscribe();
      tick();
      expect(aut.path).toBe('/api/rgw/proxy/bucket');
    })
  );

  it(
    'should call list, with enumerate returning 2 elements',
    fakeAsync(() => {
      let params = new HttpParams();
      params = params.append('bucket', 'bar');

      spyOn(service, 'enumerate').and.callFake(() => {
        return observableOf(['foo', 'bar']);
      });
      service.list().subscribe();
      tick();
      expect(aut.path).toBe('/api/rgw/proxy/bucket');
      expect(aut.params).toEqual(params);
    })
  );

  it('should call get', () => {
    let params = new HttpParams();
    params = params.append('bucket', 'foo');

    expect(service.get('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/bucket');
    expect(aut.params).toEqual(params);
  });

  it('should call create', () => {
    expect(service.create('foo', 'bar')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/bucket');
    expect(aut.body).toEqual({
      bucket: 'foo',
      uid: 'bar'
    });
  });

  it('should call update', () => {
    let params = new HttpParams();
    params = params.append('bucket', 'bar');
    params = params.append('bucket-id', 'foo');
    params = params.append('uid', 'baz');

    expect(service.update('foo', 'bar', 'baz')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/bucket');
    expect(aut.params).toEqual(params);
  });

  it('should call delete, with purgeObjects = true', () => {
    let params = new HttpParams();
    params = params.append('bucket', 'foo');
    params = params.append('purge-objects', 'true');

    expect(service.delete('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/bucket');
    expect(aut.params).toEqual(params);
  });

  it('should call delete, with purgeObjects = false', () => {
    let params = new HttpParams();
    params = params.append('bucket', 'foo');
    params = params.append('purge-objects', 'false');

    expect(service.delete('foo', false)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/bucket');
    expect(aut.params).toEqual(params);
  });

  it(
    'should call exists',
    fakeAsync(() => {
      spyOn(service, 'enumerate').and.callFake((path) => {
        return observableOf(['foo', 'bar']);
      });

      const obs = service.exists('foo');
      expect(obs).toEqual(jasmine.any(Observable));
      obs.subscribe();
      tick();
    })
  );
});
