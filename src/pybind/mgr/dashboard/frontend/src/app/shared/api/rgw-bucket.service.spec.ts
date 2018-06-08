import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { RgwBucketService } from './rgw-bucket.service';

describe('RgwBucketService', () => {
  let service: RgwBucketService;
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RgwBucketService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(RgwBucketService);
    httpClient = TestBed.get(HttpClient);
    httpTesting = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  })

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call list, with enumerate returning empty', () => {
    service.list().subscribe();
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket');
    expect(req.request.method).toBe('GET');
  });

  it('should call list, with enumerate returning 2 elements', () => {
    service.list().subscribe();
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket');
    req.flush(['foo', 'bar']);
    httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=foo');
    httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=bar');
  });

  it('should call get', () => {
    service.get('foo').subscribe();
    httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=foo');
  });

  it('should call create', () => {
    service.create('foo', 'bar').subscribe();
    const req = httpTesting.expectOne('/api/rgw/bucket');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      bucket: 'foo',
      uid: 'bar'
    });
  });

  const testurl = () => {
    httpTesting.expectOne((r) => {
      console.log(r);
      return null;
    });
  };

  it('should call update', () => {
    service.update('foo', 'bar', 'baz').subscribe();
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=bar&bucket-id=foo&uid=baz');
    expect(req.request.method).toBe('PUT');
  });

  it('should call delete, with purgeObjects = true', () => {
    service.delete('foo').subscribe();
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=foo&purge-objects=true');
    expect(req.request.method).toBe('DELETE');
  });

  it('should call delete, with purgeObjects = false', () => {
    service.delete('foo', false).subscribe();
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket?bucket=foo&purge-objects=false');
    expect(req.request.method).toBe('DELETE');
  });

  it('should call exists', () => {
    let result = undefined;
    service.exists('foo').subscribe((r) => {
      result = r
    });
    const req = httpTesting.expectOne('/api/rgw/proxy/bucket');
    req.flush(['foo', 'bar']);
    expect(result).toBe(true);
  });
});
