import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ApiUnitTest } from '../tests/util';
import { TcmuIscsiService } from './tcmu-iscsi.service';

describe('TcmuIscsiService', () => {
  let service: TcmuIscsiService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TcmuIscsiService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(TcmuIscsiService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it(
    'should call tcmuiscsi',
    fakeAsync(() => {
      expect(service.tcmuiscsi()).toEqual(jasmine.any(Promise));
      tick();
      expect(aut.path).toBe('api/tcmuiscsi');
    })
  );
});
