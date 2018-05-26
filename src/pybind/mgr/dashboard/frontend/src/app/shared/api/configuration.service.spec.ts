import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Observable } from 'rxjs';

import { ApiUnitTest } from '../tests/util';
import { ConfigurationService } from './configuration.service';

describe('ConfigurationService', () => {
  let service: ConfigurationService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConfigurationService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(ConfigurationService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call getConfigData', () => {
    expect(service.getConfigData()).toEqual(jasmine.any(Observable));
    expect(aut.path).toBe('api/cluster_conf/');
  });
});
