import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import * as _ from 'lodash';
import { OsdService } from '../osd.service';
import {TableTemplatesService} from '../../../../shared/services/table-templates.service';

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
  templateService: TableTemplatesService;

  constructor(private osdService: OsdService, templateService: TableTemplatesService) {
    this.templateService = templateService;
  }

  ngOnInit() {
    this.templateService.overwriteSetColumns(() => {
      return [
        {prop: 'hostname', name: 'Host'},
        {prop: 'id', name: 'ID', cellTemplate: this.templateService.cellTemplates.bold},
        {prop: 'states', name: 'Status'},
        //{prop: 'states', name: 'Status', pipe: 'colored_up_in'},
        {prop: 'stats.numpg', name: 'PGs'},
        //{prop: 'stats.numpg', name: 'PGs', pipe: 'dimless_binary'},
        {prop: 'usedPercent', name: 'Usage'},
        {prop: 'stats.op_out_bytes', name: 'Read bytes'},
        //{prop: 'stats.op_out_bytes', name: 'Read bytes', no_pipe: 'sparkline'},
        {prop: 'stats.op_in_bytes', name: 'Writes bytes'},
        //{prop: 'stats.op_in_bytes', name: 'Writes bytes', no_pipe: 'sparkline'},
        {prop: 'stats.op_r', name: 'Read ops'}, // per second
        //{prop: 'stats.op_r', name: 'Read ops', no_pipe: 'dimless'}, // per second
        {prop: 'stats.op_w', name: 'Write ops'} // per second
        //{prop: 'stats.op_w', name: 'Write ops', no_pipe: 'dimless'} // per second
      ];
    }, this);
  }

  getOsdList() {
    this.osdService.getList().subscribe(data => {
      this.osds = [];
      _.each(data, (host) => {
        const hostname = host[0];
        _.each(host[1], (osd) => {
          osd.hostname = hostname;
          // pipe used percent to dimmless_binary
          osd.usedPercent = osd.stats.stat_bytes_used / osd.stats.stat_bytes;
          osd.states = this.getState(osd);
          this.osds.push(osd);
        });
      });
      console.log(this.osds);
    });
  }

  getState (osd: any): string {
    const states = ['up', 'down', 'in', 'out'];
    return states.filter(state => osd[state]).join(', ');
  }
}
