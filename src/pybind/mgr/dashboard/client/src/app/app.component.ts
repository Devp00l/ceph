import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'cd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ceph_version: string;
  filesystems: any[];
  rbd_pools: any;
  rbd_mirroring: any;
  have_mon_connection: any;
  mgr_id: any;
  health_status: any;

  constructor(private http: HttpClient) {
    this.rbd_mirroring = {
      errors: 0
    };
    this.rbd_pools = [];
    this.filesystems = [];
  }

  ngOnInit(): void {
    // Make the HTTP request:
    // this.http.get('/api/items').subscribe(data => {
    //   // Read the result field from the JSON response.
    //   this.results = data['results'];
    // });
  }

  // TODO: change to pipe
  health_color(status_str) {
    if (status_str === 'HEALTH_OK') {
      return 'color: #00bb00;';
    } else if (status_str === 'HEALTH_WARN') {
      return 'color: #FFC200;';
    } else if (status_str === 'HEALTH_ERR') {
      return 'color: #ff0000;';
    }
  }

  // TODO: change to pipe
  block_health_color = function(rbd_mirroring) {
    if (rbd_mirroring.errors > 0) {
      return 'color: #ff0000';
    } else if (rbd_mirroring.warnings > 0) {
      return 'color: #ffc200';
    }
    return '';
  };
}
