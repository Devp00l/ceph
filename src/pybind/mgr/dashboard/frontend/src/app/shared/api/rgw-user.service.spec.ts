import { HttpClient, HttpParams } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { Observable, of as observableOf } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { RgwUserService } from './rgw-user.service';

describe('RgwUserService', () => {
  let service: RgwUserService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RgwUserService]
    });

    service = TestBed.get(RgwUserService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it(
    'should call list with empty result',
    fakeAsync(() => {
      aut.spyOnReturn = observableOf([]);
      service.list().subscribe();
      tick();
      expect(aut.path).toBe('/api/rgw/proxy/metadata/user');
    })
  );

  it(
    'should call list with result',
    fakeAsync(() => {
      aut.spyOnReturn = observableOf(['foo', 'bar']);
      service.list().subscribe();
      tick();
      expect(aut.path).toBe('/api/rgw/proxy/user');
    })
  );

  it('should call enumerate', () => {
    expect(service.enumerate()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/metadata/user');
  });

  it('should call get', () => {
    expect(service.get('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
  });

  it('should call getQuota', () => {
    expect(service.getQuota('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?quota');
  });

  it('should call put', () => {
    let params = new HttpParams();
    params = params.append('foo', 'bar');

    expect(service.put({ foo: 'bar' })).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
    expect(aut.params).toEqual(params);
  });

  it('should call putQuota', () => {
    let params = new HttpParams();
    params = params.append('foo', 'bar');

    expect(service.putQuota({ foo: 'bar' })).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?quota');
    expect(aut.params).toEqual(params);
  });

  it('should call post', () => {
    let params = new HttpParams();
    params = params.append('0', 'foo');
    params = params.append('1', 'bar');

    expect(service.post(['foo', 'bar'])).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
    expect(aut.params).toEqual(params);
  });

  it('should call delete', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');

    expect(service.delete('foo')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
    expect(aut.params).toEqual(params);
  });

  it('should call addSubuser with unrecognized permission', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');
    params = params.append('subuser', 'bar');
    params = params.append('key-type', 'swift');
    params = params.append('access', 'baz');
    params = params.append('generate-secret', 'true');

    expect(service.addSubuser('foo', 'bar', 'baz', null, true)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
    expect(aut.params).toEqual(params);
  });

  it('should call addSubuser with mapped permission', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');
    params = params.append('subuser', 'bar');
    params = params.append('key-type', 'swift');
    params = params.append('access', 'full');
    params = params.append('secret-key', 'baz');

    expect(service.addSubuser('foo', 'bar', 'full-control', 'baz', false)).toEqual(
      jasmine.any(Observable)
    );
    expect(aut.path).toBe('/api/rgw/proxy/user');
    expect(aut.params).toEqual(params);
  });

  it('should call deleteSubuser', () => {
    expect(service.deleteSubuser(null, null)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user');
  });

  it('should call addCapability', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');
    params = params.append('user-caps', 'bar=baz');

    expect(service.addCapability('foo', 'bar', 'baz')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?caps');
    expect(aut.params).toEqual(params);
  });

  it('should call deleteCapability', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');
    params = params.append('user-caps', 'bar=baz');

    expect(service.deleteCapability('foo', 'bar', 'baz')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?caps');
    expect(aut.params).toEqual(params);
  });

  it('should call addS3Key, with generateKey true', () => {
    expect(service.addS3Key(null, null, null, null, true)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?key');
  });

  it('should call addS3Key, with generateKey false', () => {
    expect(service.addS3Key(null, null, null, null, false)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?key');
  });

  it('should call deleteS3Key', () => {
    let params = new HttpParams();
    params = params.append('uid', 'foo');
    params = params.append('key-type', 's3');
    params = params.append('access-key', 'bar');

    expect(service.deleteS3Key('foo', 'bar')).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('/api/rgw/proxy/user?key');
    expect(aut.params).toEqual(params);
  });

  it(
    'should call exists',
    fakeAsync(() => {
      spyOn(service, 'enumerate').and.callFake(() => {
        return observableOf(['foo', 'bar']);
      });

      const obs = service.exists('foo');
      expect(obs).toEqual(jasmine.any(Observable));
      obs.subscribe();
      tick();
    })
  );
});
