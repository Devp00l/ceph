import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class OsdService {
  ///openattic/api/ceph/9a88698a-6a02-3489-834f-066465b6a73e/osds
  private osdUrl = '/openattic/api/ceph/9a88698a-6a02-3489-834f-066465b6a73e/osds';
  //the final one should look sth like this
  //"/api/osds"
  constructor (private http: HttpClient) {}

  getAll () {
    return this.http.get(this.osdUrl);
  }

  getDetails(id: number) {
    return this.http.get(`${this.osdUrl}/${id}`);
  }
}
