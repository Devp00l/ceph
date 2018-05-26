import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { of as observableOf } from 'rxjs';

import { AuthStorageService } from '../services/auth-storage.service';
import { ApiUnitTest } from '../tests/util';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let aut: ApiUnitTest;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, AuthStorageService],
      imports: [HttpClientTestingModule]
    });

    service = TestBed.get(AuthService);
    httpClient = TestBed.get(HttpClient);
    aut = new ApiUnitTest(httpClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it(
    'should login and save the user',
    fakeAsync(() => {
      const fakeCredentials = { foo: 'bar' };
      aut.spyOnReturn = observableOf({ username: 'foo' });

      service.login(<any>fakeCredentials);
      tick();
      expect(aut.path).toBe('api/auth');
      expect(aut.body).toEqual(fakeCredentials);
      expect(localStorage.getItem('dashboard_username')).toBe('foo');
    })
  );

  it(
    'should logout and remove the user',
    fakeAsync(() => {
      aut.spyOnReturn = observableOf({ username: 'foo' });

      service.logout();
      tick();
      expect(aut.path).toBe('api/auth');
      expect(localStorage.getItem('dashboard_username')).toBe(null);
    })
  );
});
