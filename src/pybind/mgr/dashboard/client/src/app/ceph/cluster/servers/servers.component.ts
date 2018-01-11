import { Component, OnInit } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'cd-servers',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.scss']
})
export class ServersComponent implements OnInit {
  servers = [];

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
     this.http.get('/servers_data').subscribe(data => {
      this.servers = data['servers'];
    });
  }

}
