import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class OsdService {
  private path = '/osd';
  constructor (private http: HttpClient) {}
  getList () {
    return this.http.get(`${this.path}/list_data`);
  }

  getDetails(id: number) {
    return this.http.get(`${this.path}/perf_data/${id}`);
  }
}
