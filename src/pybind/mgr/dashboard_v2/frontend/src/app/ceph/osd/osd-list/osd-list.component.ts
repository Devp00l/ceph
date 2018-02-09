import { Component, OnInit } from '@angular/core';
import { OsdService } from '../osd.service';
import * as _ from 'lodash';

@Component({
  selector: 'cd-osd-list',
  templateUrl: './osd-list.component.html',
  styleUrls: ['./osd-list.component.scss']
})

export class OsdListComponent implements OnInit {
  hasSelection: any;
  osds = [];
  selection: any = {};
  detailsComponent = 'OsdDetailsComponent';
  columns = [
    {prop: 'hostname', name: 'Host'},
    {prop: 'id', name: 'ID'},
    {prop: 'states', name: 'Status', no_pipe: "colored_up_in"},
    {prop: 'stats.numpg', name: 'PGs', no_pipe: "dimless_binary"},
    {prop: 'usedPercent', name: 'Usage'},
    {prop: 'stats.op_out_bytes', name: 'Read bytes', no_pipe: 'sparkline'},
    {prop: 'stats.op_in_bytes', name: 'Writes bytes',no_pipe: 'sparkline'},
    {prop: 'stats.op_r', name: 'Read ops', no_pipe: 'dimless'}, // per second
    {prop: 'stats.op_w', name: 'Write ops', no_pipe: 'dimless'} // per second
  ];

  constructor(private osdService: OsdService) {}

  ngOnInit() {
  }

  getOsdList() {
    this.osdService.getList().subscribe(data => {
      this.osds = [];
      _.each(data, (host) => {
        const hostname = host[0];
        _.each(host[1], (osd) => {
          osd.hostname = hostname;
          osd.usedPercent = osd.stats.stat_bytes_used / osd.stats.stat_bytes; // pipe dimmless_binary
          osd.states = this.getState(osd);
          this.osds.push(osd);
        });
      });
      console.log(this.osds);
    });
  }

  getState (osd: any): string {
    const states = ["up", "down", "in", "out"];
    return states.filter(state => osd[state]).join(", ");
  }
}
