import {Component, OnInit} from '@angular/core';
import {OsdService} from '../osd.service';
import * as _ from 'lodash';

@Component({
  selector: 'oa-osd-list',
  templateUrl: './osd-list.component.html',
  styleUrls: ['./osd-list.component.scss']
})

export class OsdListComponent implements OnInit {
  OsdService: any;
  error: any;
  hasSelection: any;
  osds = [];
  selection: any;
  filterConfig: any;
  detailsComponent = 'OsdDetailsComponent';
  columns = [
    {prop: 'hostname', name: 'Host'},
    {prop: 'id', name: 'ID'},
    {prop: 'status', name: 'Status'},
    {prop: 'pg_count', name: 'PGs'},
    {prop: 'kb_used', name: 'Usage'},
    {prop: 'stats.out_bytes', name: 'Read bytes', usePipe: 'sparkline'},
    {prop: 'stats.in_bytes', name: 'Writes bytes', usePipe: 'sparkline'},
    {prop: 'stats.op_r', name: 'Read ops'},
    {prop: 'stats.op_w', name: 'Write ops'}
  ];

  constructor(OsdService: OsdService) {
    //this.$state = $state;
    this.OsdService = OsdService;

    this.error = false;

    this.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null
    };

    this.selection = {};
  }

  ngOnInit() {
  }

  fakeOsds(hm: number) {
    let i;
    const osds = [];
    for (i = 0; i < hm; i++) {
      const kb = Math.pow(1024, 3) * i;
      let used = Math.floor(kb * 0.01 * i);
      let avail = kb - used;
      if (avail < 0){
        avail = 0;
        used = kb;
      }
      osds.push({
        id: i,
        name: `osd.${i}`,
        'cluster': '9a88698a-6a02-3489-834f-066465b6a73e',
        'crush_weight': 0.009689,
        'exists': 1,
        'primary_affinity': 1,
        'reweight': 1,
        'pg_count': Math.pow(2, i % 12),
        'status': 'up',
        'type': 'osd',
        'hostname': 'ds-zillo-1',
        'in_state': 1,
        'osd_objectstore': 'bluestore',
        'kb': kb,
        'kb_used': used,
        'kb_avail': avail,
        stats: {
          out_bytes: Math.floor(Math.pow(1024, 3) * Math.random()),
          in_bytes: Math.floor(Math.pow(1024, 3) * Math.random()),
          op_r:  i * i,
          op_w:  i * 2,
        }
      });
    }
    return osds;
  }

  getOsdList() {
    //this.OsdService.getOsds().subscribe(data => this.osds = data.results);
    setTimeout(() => {
      this.osds = this.fakeOsds(100);
    }, 0);
  }

  onSelectionChange(selection) {
    this.selection = selection;

    const item = selection.item;
    const items = selection.items;
    this.hasSelection = Boolean(item);

    if (!items || items.length !== 1) {
      //this.$state.go("cephOsds");
      return;
    }

    //this.$state.go("cephOsds.statistics", {
    //"#": "more"
    //});
  }
}


