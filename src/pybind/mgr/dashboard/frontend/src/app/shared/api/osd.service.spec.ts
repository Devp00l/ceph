import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { OsdService } from './osd.service';

describe('OsdService', () => {
  let service: OsdService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OsdService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(OsdService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getList', () => {
    expect(service.getList()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/osd');
  });

  it('should call getDetails', () => {
    expect(service.getDetails(1)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/osd/1');
  });

  it('should call scrub, with deep=true', () => {
    expect(service.scrub('foo', true)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/osd/foo/scrub?deep=true');
  });

  it('should call scrub, with deep=false', () => {
    expect(service.scrub('foo', false)).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/osd/foo/scrub?deep=false');
  });
});
