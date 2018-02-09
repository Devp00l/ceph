import { Component, Input, OnInit } from '@angular/core';
import { OsdService } from '../osd.service';

import * as _ from 'lodash';

@Component({
  selector: 'cd-osd-details',
  templateUrl: './osd-details.component.html',
  styleUrls: ['./osd-details.component.scss']
})
export class OsdDetailsComponent implements OnInit {
  @Input() selected?: any[];
  makeCol = [
    {prop: 'key'},
    {prop: 'value'}
  ];

  constructor(private osdService: OsdService) {}

  ngOnInit() {
    console.log(this.selected);
    _.each(this.selected, (osd) => {
      this.refresh(osd);
    });
  }

  refresh(osd: any) {
    this.osdService.getDetails(osd.id).subscribe((data: any) => {
      osd.opWLatencyInBytesHistogram = data.osd_histogram.osd.op_w_latency_in_bytes_histogram;
      osd.opRLatencyOutBytesHistogram = data.osd_histogram.osd.op_r_latency_out_bytes_histogram;
      osd.osd = data.osd;
      osd.osd_metadata = data.osd_metadata;
      osd.loaded = true;
      /*
      setTimeout(() => {
        this.refresh(osd);
      }, 20000);
      */
    });
  }

  pass () {}

  makeData (sth) {
    const bla = Object.keys(sth).map(k => ({
      key: k,
      value: sth[k]
    }));
    return bla;
  }
}
