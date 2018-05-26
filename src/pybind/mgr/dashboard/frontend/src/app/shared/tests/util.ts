import { HttpClient } from '@angular/common/http';

import { of as observableOf } from 'rxjs';

export class ApiUnitTest {
  public path: string;
  public body: any;
  public params: any;
  public spyOnReturn: any;

  constructor(httpClient: HttpClient) {
    spyOn(httpClient, 'get').and.callFake((path, options) => {
      this.path = path;
      this.params = options ? options.params : undefined;
      return this.spyOnReturn || observableOf();
    });

    spyOn(httpClient, 'post').and.callFake((path, body, options) => {
      this.path = path;
      this.body = body;
      this.params = options ? options.params : undefined;
      return this.spyOnReturn || observableOf();
    });

    spyOn(httpClient, 'put').and.callFake((path, body, options) => {
      this.path = path;
      this.body = body;
      this.params = options ? options.params : undefined;
      return this.spyOnReturn || observableOf();
    });

    spyOn(httpClient, 'delete').and.callFake((path, options) => {
      this.path = path;
      this.params = options ? options.params : undefined;
      return this.spyOnReturn || observableOf();
    });
  }
}
